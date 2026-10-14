package com.sync.coach.capture

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import android.util.AtomicFile
import java.io.File
import java.io.IOException
import java.security.KeyStore
import java.util.concurrent.ConcurrentHashMap
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/**
 * A tiny encrypted local inbox for notifications awaiting user review.
 * Each line is independently AES-GCM encrypted with an Android Keystore key.
 */
class EncryptedEventStore(
    context: Context,
    private val fileName: String = DEFAULT_FILE_NAME,
    private val keyAlias: String = DEFAULT_KEY_ALIAS,
    private val maxRecords: Int = DEFAULT_MAX_RECORDS,
    private val retentionMillis: Long = DEFAULT_RETENTION_MILLIS
) {
    private val storeFile = File(context.filesDir, fileName)
    private val lock = locks.getOrPut(storeFile.absolutePath) { Any() }
    private val atomicFile = AtomicFile(storeFile)

    init { require(maxRecords > 0 && retentionMillis >= 0) }

    fun append(message: CapturedMessage) = synchronized(lock) {
        val retained = liveRecords(System.currentTimeMillis())
        if (retained.any { it.second.id == message.id }) return@synchronized
        rewriteLocked(retained.takeLast(maxRecords - 1).map { it.first } + encrypt(message.toJson()))
    }

    fun loadRecent(): List<CapturedMessage> = synchronized(lock) {
        pruneExpiredLocked(System.currentTimeMillis())
        return readRecordsLocked().map { it.second }.sortedByDescending(CapturedMessage::receivedAt)
    }

    fun clear() = synchronized(lock) {
        atomicFile.delete()
    }

    fun remove(messageId: String) = synchronized(lock) {
        val retained = readRecordsLocked().filterNot { it.second.id == messageId }.map { it.first }
        rewriteLocked(retained)
    }

    fun pruneExpired() = synchronized(lock) {
        pruneExpiredLocked(System.currentTimeMillis())
    }

    fun replace(message: CapturedMessage): Boolean = synchronized(lock) {
        val records = readRecordsLocked()
        if (records.none { it.second.id == message.id }) return@synchronized false
        rewriteLocked(records.map { if (it.second.id == message.id) encrypt(message.toJson()) else it.first })
        true
    }

    private fun readRecordsLocked(): List<Pair<String, CapturedMessage>> {
        if (!storeFile.exists() && !File(storeFile.path + ".bak").exists()) return emptyList()
        return try {
            atomicFile.openRead().bufferedReader(Charsets.UTF_8).useLines { lines ->
                lines.filter { it.isNotBlank() }.map { it to CapturedMessage.fromJson(decrypt(it)) }.toList()
            }
        } catch (_: Exception) {
            // Preserve the original file on corruption or key loss. Never print raw records.
            throw IOException("암호화 보관함을 읽을 수 없습니다. 원본 파일은 유지됩니다.")
        }
    }

    private fun liveRecords(now: Long) = readRecordsLocked().filter {
        now - it.second.receivedAt <= retentionMillis
    }.takeLast(maxRecords)

    private fun pruneExpiredLocked(now: Long) {
        val records = readRecordsLocked()
        val retained = records.filter { now - it.second.receivedAt <= retentionMillis }.takeLast(maxRecords)
        if (retained.size != records.size) rewriteLocked(retained.map { it.first })
    }

    private fun rewriteLocked(lines: List<String>) {
        if (lines.isEmpty()) {
            atomicFile.delete()
            return
        }
        val output = atomicFile.startWrite()
        try {
            output.write(lines.joinToString(separator = "\n", postfix = "\n").toByteArray(Charsets.UTF_8))
            atomicFile.finishWrite(output)
        } catch (failure: Exception) {
            atomicFile.failWrite(output)
            throw failure
        }
    }

    private fun encrypt(plainText: String): String {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())
        val encrypted = cipher.doFinal(plainText.toByteArray(Charsets.UTF_8))
        return "${Base64.encodeToString(cipher.iv, Base64.NO_WRAP)}.${Base64.encodeToString(encrypted, Base64.NO_WRAP)}"
    }

    private fun decrypt(record: String): String {
        val parts = record.split('.', limit = 2)
        require(parts.size == 2)
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(
            Cipher.DECRYPT_MODE,
            KeyStore.getInstance(ANDROID_KEY_STORE).apply { load(null) }.getKey(keyAlias, null) as? SecretKey
                ?: throw IOException("암호화 키를 확인할 수 없습니다."),
            GCMParameterSpec(GCM_TAG_LENGTH_BITS, Base64.decode(parts[0], Base64.NO_WRAP))
        )
        return String(cipher.doFinal(Base64.decode(parts[1], Base64.NO_WRAP)), Charsets.UTF_8)
    }

    private fun getOrCreateKey(): SecretKey = synchronized(keyLock) {
        val keyStore = KeyStore.getInstance(ANDROID_KEY_STORE).apply { load(null) }
        (keyStore.getKey(keyAlias, null) as? SecretKey)?.let { return@synchronized it }

        val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEY_STORE)
        val spec = KeyGenParameterSpec.Builder(
            keyAlias,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .build()
        keyGenerator.init(spec)
        keyGenerator.generateKey()
    }

    private companion object {
        val locks = ConcurrentHashMap<String, Any>()
        val keyLock = Any()
        const val DEFAULT_FILE_NAME = "sync_pending_messages.v1"
        const val DEFAULT_KEY_ALIAS = "sync_pending_messages_key_v1"
        const val ANDROID_KEY_STORE = "AndroidKeyStore"
        const val TRANSFORMATION = "AES/GCM/NoPadding"
        const val GCM_TAG_LENGTH_BITS = 128
        const val DEFAULT_MAX_RECORDS = 200
        const val DEFAULT_RETENTION_MILLIS = 24L * 60L * 60L * 1000L
    }
}
