package com.sync.coach.reply

object ExampleSelection {
    fun resolve(ids: Set<String>, available: List<StyleExample>, relationship: Relationship): List<StyleExample> {
        require(ids.size <= 5)
        return ids.map { id ->
            val example = available.find { it.id == id && it.relationship == relationship }
                ?: throw IllegalArgumentException("예문이 삭제되었거나 관계가 변경되었습니다.")
            example.copy(text = example.text.take(120))
        }
    }
}
