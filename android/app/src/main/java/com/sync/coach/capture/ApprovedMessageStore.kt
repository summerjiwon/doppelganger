package com.sync.coach.capture

import android.content.Context

/**
 * Messages arrive here only after a person explicitly chooses them in Sync's
 * review screen. They remain encrypted locally and are never uploaded by this
 * class; a later AI request must be initiated from the UI.
 */
class ApprovedMessageStore(context: Context) {
    private val store = EncryptedEventStore(
        context = context,
        fileName = "sync_approved_messages.v1",
        keyAlias = "sync_approved_messages_key_v1",
        maxRecords = 1_000,
        retentionMillis = Long.MAX_VALUE
    )

    fun promote(message: CapturedMessage) {
        if (store.loadRecent().none { it.id == message.id }) store.append(message)
    }

    fun count(): Int = store.loadRecent().size
}
