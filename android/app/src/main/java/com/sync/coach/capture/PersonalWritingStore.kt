package com.sync.coach.capture

import android.content.Context
import java.util.UUID
import com.sync.coach.reply.Relationship
import com.sync.coach.reply.StyleExample

/**
 * A corpus of user-authored text. Content reaches this store only through the
 * explicit '내 말투 문장 추가' screen or a future Sync keyboard action.
 */
class PersonalWritingStore internal constructor(private val store: EncryptedEventStore) {
    constructor(context: Context) : this(EncryptedEventStore(
        context = context,
        fileName = "sync_personal_writing.v1",
        keyAlias = "sync_personal_writing_key_v1",
        maxRecords = 2_000,
        retentionMillis = Long.MAX_VALUE
    ))

    fun addLines(rawText: String, relationship: Relationship? = null): Int {
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
                    receivedAt = System.currentTimeMillis(),
                    relationship = relationship?.name,
                )
            )
        }
        return lines.size
    }

    fun count(): Int = store.loadRecent().size

    fun listExamples(): List<StyleExample> = store.loadRecent()
        .filter { it.sourcePackage == "user-authored" }
        .map { message -> StyleExample(message.id, message.text, Relationship.entries.find { it.name == message.relationship }) }

    fun assignRelationship(id: String, relationship: Relationship?): Boolean {
        val original = store.loadRecent().find { it.id == id && it.sourcePackage == "user-authored" } ?: return false
        return store.replace(original.copy(relationship = relationship?.name))
    }

    fun remove(id: String) = store.remove(id)
}
