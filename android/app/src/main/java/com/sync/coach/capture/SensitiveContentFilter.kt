package com.sync.coach.capture

/**
 * Keeps accidental secrets out of Sync before the message ever reaches disk.
 * This is deliberately conservative; users can still view the original message
 * in the messenger app, while Sync stores a redacted reminder only.
 */
object SensitiveContentFilter {
    private val otpPattern = Regex(
        "(?i)(인증번호|인증 코드|verification code|one[- ]time password|otp)\\D{0,16}\\d{4,8}"
    )
    private val cardPattern = Regex("\\b(?:\\d[ -]?){13,19}\\b")
    private val accountPattern = Regex("(?i)(계좌|account)\\D{0,12}\\d(?:[ -]?\\d){8,}")

    fun redact(input: String): String? {
        val compact = input.trim().replace(Regex("\\s+"), " ")
        if (compact.isBlank()) return null

        var result = compact
        result = result.replace(otpPattern) { "${it.groupValues[1]} [보안 코드 숨김]" }
        result = result.replace(cardPattern, "[카드 번호 숨김]")
        result = result.replace(accountPattern) { "${it.groupValues[1]} [계좌 정보 숨김]" }

        return result.take(MAX_MESSAGE_LENGTH)
    }

    private const val MAX_MESSAGE_LENGTH = 1_000
}
