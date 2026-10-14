package com.sync.coach.reply

import androidx.test.ext.junit.runners.AndroidJUnit4
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ExampleSelectionTest {
    @Test fun selectedIdsOnlyAreIncludedWithBoundedLength() {
        val available = listOf(StyleExample("a", "가".repeat(500), Relationship.FRIEND), StyleExample("b", "선택하지 않은 문장", Relationship.FRIEND))
        val selected = ExampleSelection.resolve(setOf("a"), available, Relationship.FRIEND)
        assertEquals(120, selected.single().text.length)
        val request = ReplyRequest("오늘 시간 있어?", Relationship.FRIEND, ReplyIntent.ASK, styleExamples = selected)
        val data = JSONObject(request.userMessage())
        assertEquals(1, data.getJSONArray("본인 말투 예문").length())
        assertFalse(request.userMessage().contains("선택하지 않은 문장"))
        assertFalse(request.systemInstruction().contains(selected.single().text))
    }

    @Test fun otherRelationsUnclassifiedAndDeletedExamplesAreRejected() {
        val examples = listOf(StyleExample("a", "가상", Relationship.WORK), StyleExample("b", "가상", null))
        for (id in listOf("a", "b", "deleted")) assertThrows(IllegalArgumentException::class.java) {
            ExampleSelection.resolve(setOf(id), examples, Relationship.FRIEND)
        }
    }

    @Test fun maximumAndRequestBoundariesAreEnforced() {
        val examples = (1..6).map { StyleExample("$it", "가상 문장 $it", Relationship.FRIEND) }
        assertEquals(5, ExampleSelection.resolve((1..5).map { "$it" }.toSet(), examples, Relationship.FRIEND).size)
        assertThrows(IllegalArgumentException::class.java) { ExampleSelection.resolve(examples.map { it.id }.toSet(), examples, Relationship.FRIEND) }
        assertThrows(IllegalArgumentException::class.java) { ReplyRequest("가상", Relationship.WORK, ReplyIntent.ASK, styleExamples = examples.take(1)) }
        assertThrows(IllegalArgumentException::class.java) { ReplyRequest("가상", Relationship.FRIEND, ReplyIntent.ASK, styleExamples = listOf(examples[0], examples[0])) }
        assertFalse(ReplyRequest("가상", Relationship.FRIEND, ReplyIntent.ASK).userMessage().contains("본인 말투 예문"))
    }
}
