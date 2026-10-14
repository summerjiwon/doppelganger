package com.sync.coach

import android.os.SystemClock
import android.widget.Button
import android.widget.EditText
import android.widget.Spinner
import android.widget.TextView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.sync.coach.reply.Relationship
import com.sync.coach.reply.ReplyIntent
import java.io.File
import org.junit.Assert.*
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

/** Requires the separately installed model. Only synthetic messages are used. */
@RunWith(AndroidJUnit4::class)
class LocalReplyGenerationTest {
    @Test fun selectedRelationshipsGenerateLocalReplies() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        assumeTrue("별도 모델 설치 필요", File(context.filesDir, "local-reply.litertlm").exists())
        ActivityScenario.launch(LocalReplyActivity::class.java).use { scenario ->
            scenario.onActivity { it.window.decorView.findViewWithTag<Button>("load_model").performClick() }
            awaitStatus(scenario, "준비 완료")
            for (relationship in listOf(Relationship.WORK, Relationship.FRIEND)) {
                scenario.onActivity { activity ->
                    val root = activity.window.decorView
                    root.findViewWithTag<Spinner>("relationship").setSelection(relationship.ordinal + 1)
                    root.findViewWithTag<Spinner>("reply_intent").setSelection(ReplyIntent.DECLINE.ordinal + 1)
                    root.findViewWithTag<EditText>("incoming_message").setText("이번 주 토요일 저녁에 만나서 밥 먹을래?")
                }
                InstrumentationRegistry.getInstrumentation().waitForIdleSync()
                scenario.onActivity { it.window.decorView.findViewWithTag<Button>("generate_reply").performClick() }
                awaitStatus(scenario, "생성 완료")
                scenario.onActivity {
                    val answer = it.window.decorView.findViewWithTag<TextView>("reply_result").text.toString()
                    assertTrue(answer.isNotBlank())
                    assertFalse(answer.contains("선약"))
                    println("가상 시나리오 / ${relationship.label} / 거절: $answer")
                }
            }
        }
    }

    private fun awaitStatus(scenario: ActivityScenario<LocalReplyActivity>, prefix: String) {
        val deadline = SystemClock.elapsedRealtime() + 45_000
        while (SystemClock.elapsedRealtime() < deadline) {
            var status = ""
            scenario.onActivity { status = it.window.decorView.findViewWithTag<TextView>("reply_status").text.toString() }
            if (status.startsWith(prefix)) return
            if (status.startsWith("실행 실패") || status.startsWith("메모리가 부족")) fail(status)
            SystemClock.sleep(150)
        }
        fail("시간 내에 $prefix 상태에 도달하지 못했습니다.")
    }
}
