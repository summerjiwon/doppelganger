package com.sync.coach

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.ScrollView
import androidx.core.app.NotificationManagerCompat
import com.sync.coach.capture.ApprovedMessageStore
import com.sync.coach.capture.CaptureSettings
import com.sync.coach.capture.EncryptedEventStore
import com.sync.coach.capture.PersonalWritingStore

/**
 * Deliberately small consent-first setup screen for the capture MVP.
 * Conversation text is never rendered here; review and recommendation UI comes
 * after the user has explicitly selected what to keep.
 */
class MainActivity : Activity() {
    private lateinit var status: TextView
    private lateinit var settings: CaptureSettings
    private lateinit var store: EncryptedEventStore
    private lateinit var approvedStore: ApprovedMessageStore
    private lateinit var personalWritingStore: PersonalWritingStore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        settings = CaptureSettings(this)
        store = EncryptedEventStore(this)
        approvedStore = ApprovedMessageStore(this)
        personalWritingStore = PersonalWritingStore(this)

        val padding = (24 * resources.displayMetrics.density).toInt()
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(padding, padding, padding, padding)
        }

        layout.addView(TextView(this).apply {
            text = "Doppelganger 알림 수집 MVP"
            textSize = 24f
        })
        layout.addView(TextView(this).apply {
            text = "카카오톡 알림은 사용자가 허용한 뒤에만 기기 안의 암호화된 임시 보관함에 24시간 저장됩니다. 이 단계에서는 AI 전송, 자동 답장, 화면 감시를 하지 않습니다."
            textSize = 16f
            setPadding(0, padding / 2, 0, padding)
        })

        layout.addView(Button(this).apply {
            text = "Android 알림 접근 권한 열기"
            setOnClickListener {
                startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
            }
        })
        layout.addView(Button(this).apply {
            text = "카카오톡 수집 켜기 / 끄기"
            setOnClickListener {
                if (!isNotificationAccessGranted()) return@setOnClickListener
                settings.isCaptureEnabled = !settings.isCaptureEnabled
                renderStatus()
            }
        })
        layout.addView(Button(this).apply {
            text = "임시 보관함 비우기"
            setOnClickListener {
                store.clear()
                renderStatus()
            }
        })
        layout.addView(Button(this).apply {
            text = "임시 메시지 검토하기"
            setOnClickListener { startActivity(Intent(this@MainActivity, ReviewActivity::class.java)) }
        })
        layout.addView(Button(this).apply {
            text = "내 말투 문장 추가"
            setOnClickListener { startActivity(Intent(this@MainActivity, MyWritingActivity::class.java)) }
        })
        status = TextView(this).apply { textSize = 16f }
        layout.addView(Button(this).apply {
            text = "로컬 AI 답변 테스트"
            setOnClickListener { startActivity(Intent(this@MainActivity, LocalReplyActivity::class.java)) }
        })
        layout.addView(status)
        setContentView(ScrollView(this).apply { addView(layout) })
    }

    override fun onResume() {
        super.onResume()
        renderStatus()
    }

    private fun renderStatus() {
        val permission = isNotificationAccessGranted()
        val capture = settings.isCaptureEnabled
        val recordCount = runCatching { store.loadRecent().size.toString() }.getOrDefault("확인 필요")
        status.text = buildString {
            append("알림 접근 권한: ").append(if (permission) "허용됨" else "허용 필요")
            append("\n카카오톡 수집: ").append(if (capture) "켜짐" else "꺼짐")
            append("\n암호화된 임시 메시지: ").append(recordCount).append("개")
            append("\n사용자 승인 분석 대상: ").append(runCatching { approvedStore.count().toString() }.getOrDefault("확인 필요")).append("개")
            append("\n내 말투 학습 문장: ").append(runCatching { personalWritingStore.count().toString() }.getOrDefault("확인 필요")).append("개")
            if (!permission) append("\n\n먼저 Android 설정에서 Doppelganger의 알림 접근을 허용해주세요.")
        }
    }

    private fun isNotificationAccessGranted(): Boolean {
        return packageName in NotificationManagerCompat.getEnabledListenerPackages(this)
    }
}
