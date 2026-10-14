package com.sync.coach

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.ThinkingConfig
import com.sync.coach.reply.Relationship
import com.sync.coach.reply.ReplyIntent
import com.sync.coach.reply.ReplyRequest
import com.sync.coach.reply.StyleExample
import java.io.File
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

/** Uses synthetic in-memory examples, never reads the user's writing corpus. */
@RunWith(AndroidJUnit4::class)
class StyleExampleGenerationTest {
    @Test fun fiveExamplesCanBePassedToTheInstalledLocalModel() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val model = File(context.filesDir, "local-reply.litertlm")
        assumeTrue("별도 모델 설치 필요", model.isFile)
        ModelIntegrity.verify(model)
        val phrases = listOf("오키ㅋㅋ 좋아!", "응응 그럼 그렇게 하자~", "좋아ㅋㅋ 이따 얘기하자", "오키 나도 괜찮아!", "응응 알겠어~")
        val request = ReplyRequest("내일 이야기할까?", Relationship.FRIEND, ReplyIntent.ACCEPT,
            styleExamples = phrases.mapIndexed { index, text -> StyleExample("fixture-$index", text, Relationship.FRIEND) })
        val engine = Engine(EngineConfig(modelPath = model.absolutePath, backend = Backend.GPU(), maxNumTokens = 4096, cacheDir = context.cacheDir.absolutePath))
        engine.initialize()
        try {
            engine.createConversation(ConversationConfig(systemInstruction = Contents.of(request.systemInstruction()),
                maxOutputToken = 192, thinkingConfig = ThinkingConfig(enableThinking = false))).use {
                val reply = it.sendMessage(request.userMessage()).toString()
                assertTrue(reply.isNotBlank())
                println("가상 예문 5개 생성 확인: $reply")
            }
        } finally { engine.close() }
    }
}
