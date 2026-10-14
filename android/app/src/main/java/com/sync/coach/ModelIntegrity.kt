package com.sync.coach

import java.io.File
import java.security.MessageDigest

/** Trusted model is pinned in code, never supplied by the document provider. */
internal object ModelIntegrity {
    private const val SIZE = 2_008_432_640L
    private const val SHA256 = "a53a59001894c58e6bdb5b9b227709f91a2e3e556baa7d85acf9c55402ba5cf5"

    fun verify(file: File, cancelled: () -> Boolean = { false }) =
        verifyAgainst(file, SIZE, SHA256, cancelled)

    internal fun verifyAgainst(file: File, size: Long, sha256: String, cancelled: () -> Boolean = { false }) {
        require(file.isFile && file.length() == size) { "지원하는 모델 파일이 아닙니다." }
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().buffered().use { source ->
            val buffer = ByteArray(1024 * 1024)
            while (true) {
                check(!cancelled()) { "취소되었습니다." }
                val read = source.read(buffer)
                if (read < 0) break
                digest.update(buffer, 0, read)
            }
        }
        val actual = digest.digest().joinToString("") { "%02x".format(it.toInt() and 0xff) }
        require(actual == sha256) { "모델 무결성을 확인할 수 없습니다." }
    }
}
