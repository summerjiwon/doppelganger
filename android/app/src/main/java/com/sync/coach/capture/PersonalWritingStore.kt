package com.sync.coach.capture

import android.content.Context
import java.util.UUID

/**
 * A corpus of user-authored text. Content reaches this store only through the
 * explicit '내 말투 문장 추가' screen or a future Sync keyboard action.
 */
class PersonalWritingStore(context: Context) {
    private val store = EncryptedEventStore(
        context = context,
        fileName = "sync_personal_writing.v1",
        keyAlias = "sync_personal_writing_key_v1",
        maxRecords = 2_000,
        retentionMillis = Long.MAX_VALUE
    )

    fun addLines(rawText: String): Int {
        val lines = rawText.lineSequence()
            .mapNotNull(SensitiveContentFilter::redact)
            .filter { it.isNotBlank() }
            .distinct()
            .toList()

        lines.forEach { line ->
            store.append(
                CapturedMessage(
                    id = UUID.randomUUID().toString(),
                    sourcePackage = "user-authored",
                    sender = "나",
                    text = line,
                    receivedAt = System.currentTimeMillis()
                )
            )
        }
        return lines.size
    }

    fun count(): Int = store.loadRecent().size
}
