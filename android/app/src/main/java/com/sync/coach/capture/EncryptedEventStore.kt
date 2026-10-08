package com.sync.coach.capture

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.io.File
import java.security.KeyStore
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
    private val lock = Any()
    private val storeFile = File(context.filesDir, fileName)

    fun append(message: CapturedMessage) = synchronized(lock) {
        pruneExpiredLocked(System.currentTimeMillis())
        storeFile.parentFile?.mkdirs()
        storeFile.appendText(encrypt(message.toJson()) + "\n", Charsets.UTF_8)
        trimToMaxRecordsLocked()
    }

    fun loadRecent(): List<CapturedMessage> = synchronized(lock) {
        pruneExpiredLocked(System.currentTimeMillis())
        return readAllLocked().sortedByDescending(CapturedMessage::receivedAt)
    }

    fun clear() = synchronized(lock) {
        if (storeFile.exists()) storeFile.delete()
    }

    fun remove(messageId: String) = synchronized(lock) {
        if (!storeFile.exists()) return@synchronized
        val retained = readAllLocked().filterNot { it.id == messageId }.map { encrypt(it.toJson()) }
        rewriteLocked(retained)
    }

    fun pruneExpired() = synchronized(lock) {
        pruneExpiredLocked(System.currentTimeMillis())
    }

    private fun readAllLocked(): List<CapturedMessage> {
        if (!storeFile.exists()) return emptyList()
        return storeFile.useLines { lines ->
            lines.mapNotNull { line -> decrypt(line)?.let(CapturedMessage::fromJson) }.toList()
        }
    }

    private fun pruneExpiredLocked(now: Long) {
        if (!storeFile.exists()) return
        val retained = storeFile.useLines { lines ->
            lines.mapNotNull { line ->
                decrypt(line)?.let(CapturedMessage::fromJson)
                    ?.takeIf { now - it.receivedAt <= retentionMillis }
                    ?.let { encrypt(it.toJson()) }
            }.toList()
        }
        rewriteLocked(retained.takeLast(maxRecords))
    }

    private fun trimToMaxRecordsLocked() {
        if (!storeFile.exists()) return
        val lines = storeFile.readLines(Charsets.UTF_8)
        if (lines.size > maxRecords) rewriteLocked(lines.takeLast(maxRecords))
    }

    private fun rewriteLocked(lines: List<String>) {
        if (lines.isEmpty()) {
            storeFile.delete()
            return
        }
        val temporary = File(storeFile.parentFile, "$fileName.tmp")
        temporary.writeText(lines.joinToString(separator = "\n", postfix = "\n"), Charsets.UTF_8)
        if (!temporary.renameTo(storeFile)) {
            temporary.delete()
        }
    }

    private fun encrypt(plainText: String): String {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())
        val encrypted = cipher.doFinal(plainText.toByteArray(Charsets.UTF_8))
        return "${Base64.encodeToString(cipher.iv, Base64.NO_WRAP)}.${Base64.encodeToString(encrypted, Base64.NO_WRAP)}"
    }

    private fun decrypt(record: String): String? = runCatching {
        val parts = record.split('.', limit = 2)
        require(parts.size == 2)
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(
            Cipher.DECRYPT_MODE,
            getOrCreateKey(),
            GCMParameterSpec(GCM_TAG_LENGTH_BITS, Base64.decode(parts[0], Base64.NO_WRAP))
        )
        String(cipher.doFinal(Base64.decode(parts[1], Base64.NO_WRAP)), Charsets.UTF_8)
    }.getOrNull()

    private fun getOrCreateKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEY_STORE).apply { load(null) }
        (keyStore.getKey(keyAlias, null) as? SecretKey)?.let { return it }

        val keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEY_STORE)
        val spec = KeyGenParameterSpec.Builder(
            keyAlias,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .build()
        keyGenerator.init(spec)
        return keyGenerator.generateKey()
    }

    private companion object {
        const val DEFAULT_FILE_NAME = "sync_pending_messages.v1"
        const val DEFAULT_KEY_ALIAS = "sync_pending_messages_key_v1"
        const val ANDROID_KEY_STORE = "AndroidKeyStore"
        const val TRANSFORMATION = "AES/GCM/NoPadding"
        const val GCM_TAG_LENGTH_BITS = 128
        const val DEFAULT_MAX_RECORDS = 200
        const val DEFAULT_RETENTION_MILLIS = 24L * 60L * 60L * 1000L
    }
}
