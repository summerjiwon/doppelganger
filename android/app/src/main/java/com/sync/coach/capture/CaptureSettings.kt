package com.sync.coach.capture

import android.content.Context

/**
 * Stores collection consent separately from Android's notification permission.
 * Both must be enabled before any notification content is processed.
 */
class CaptureSettings(context: Context) {
    private val preferences = context.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)

    var isCaptureEnabled: Boolean
        get() = preferences.getBoolean(KEY_CAPTURE_ENABLED, false)
        set(value) = preferences.edit().putBoolean(KEY_CAPTURE_ENABLED, value).apply()

    fun allowedPackages(): Set<String> =
        preferences.getStringSet(KEY_ALLOWED_PACKAGES, DEFAULT_ALLOWED_PACKAGES)?.toSet().orEmpty()

    fun setPackageAllowed(packageName: String, allowed: Boolean) {
        val updated = allowedPackages().toMutableSet()
        if (allowed) updated += packageName else updated -= packageName
        preferences.edit().putStringSet(KEY_ALLOWED_PACKAGES, updated).apply()
    }

    fun isPackageAllowed(packageName: String): Boolean =
        isCaptureEnabled && packageName in allowedPackages()

    private companion object {
        const val PREFERENCES = "sync_capture_settings_v1"
        const val KEY_CAPTURE_ENABLED = "capture_enabled"
        const val KEY_ALLOWED_PACKAGES = "allowed_packages"
        val DEFAULT_ALLOWED_PACKAGES = setOf("com.kakao.talk")
    }
}
