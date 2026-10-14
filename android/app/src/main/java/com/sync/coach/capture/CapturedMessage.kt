package com.sync.coach.capture

import org.json.JSONObject

/** A minimal, locally encrypted record. No notification extras are retained. */
data class CapturedMessage(
    val id: String,
    val sourcePackage: String,
    val sender: String?,
    val text: String,
    val receivedAt: Long,
    val relationship: String? = null,
) {
    fun toJson(): String = JSONObject()
        .put("id", id)
        .put("sourcePackage", sourcePackage)
        .put("sender", sender)
        .put("text", text)
        .put("receivedAt", receivedAt)
        .put("relationship", relationship ?: JSONObject.NULL)
        .toString()

    companion object {
        fun fromJson(json: String): CapturedMessage {
            val value = JSONObject(json)
            return CapturedMessage(
                id = value.getString("id"),
                sourcePackage = value.getString("sourcePackage"),
                sender = value.optString("sender").takeIf { it.isNotBlank() },
                text = value.getString("text"),
                receivedAt = value.getLong("receivedAt"),
                relationship = if (value.isNull("relationship")) null else value.optString("relationship").takeIf { it.isNotBlank() },
            )
        }
    }
}
