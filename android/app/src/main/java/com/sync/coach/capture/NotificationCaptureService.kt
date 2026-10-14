package com.sync.coach.capture

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.util.UUID

/**
 * Event-driven collector. It receives only notifications Android makes available
 * after the user explicitly enables notification access.
 */
class NotificationCaptureService : NotificationListenerService() {
    private var lastFingerprint: String? = null
    private var lastCapturedAt: Long = 0L

    override fun onListenerConnected() {
        super.onListenerConnected()
        CaptureCleanupWorker.schedule(applicationContext)
    }

    override fun onNotificationPosted(notification: StatusBarNotification) {
        val settings = CaptureSettings(applicationContext)
        if (!settings.isPackageAllowed(notification.packageName)) return
        if (notification.notification.flags and Notification.FLAG_GROUP_SUMMARY != 0) return

        val extras = notification.notification.extras ?: return
        val text = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)
            ?: extras.getCharSequence(Notification.EXTRA_TEXT)
            ?: return
        val safeText = SensitiveContentFilter.redact(text.toString()) ?: return
        val sender = extras.getCharSequence(Notification.EXTRA_TITLE)
            ?.toString()
            ?.let(SensitiveContentFilter::redact)
            ?.take(120)
            ?.takeIf { it.isNotEmpty() }

        // Apps can update a notification without creating a new message. Ignore an
        // immediately repeated event instead of waking storage and encryption again.
        val fingerprint = "${notification.packageName}|$sender|$safeText"
        if (fingerprint == lastFingerprint && notification.postTime - lastCapturedAt < DUPLICATE_WINDOW_MILLIS) {
            return
        }
        lastFingerprint = fingerprint
        lastCapturedAt = notification.postTime

        val message = CapturedMessage(
            id = UUID.randomUUID().toString(),
            sourcePackage = notification.packageName,
            sender = sender,
            text = safeText,
            receivedAt = notification.postTime
        )

        // No logs, analytics, network requests, or automatic reply occur here.
        // A damaged inbox must not be replaced or bring down the listener.
        runCatching { EncryptedEventStore(applicationContext).append(message) }
    }

    private companion object {
        const val DUPLICATE_WINDOW_MILLIS = 60_000L
    }
}
