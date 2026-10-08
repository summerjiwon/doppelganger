package com.sync.coach

import android.app.Activity
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import com.sync.coach.capture.ApprovedMessageStore
import com.sync.coach.capture.CapturedMessage
import com.sync.coach.capture.EncryptedEventStore
import java.text.DateFormat
import java.util.Date

/**
 * A deliberate privacy boundary: notification records must be reviewed here
 * before they become retained analysis context.
 */
class ReviewActivity : Activity() {
    private lateinit var pendingStore: EncryptedEventStore
    private lateinit var approvedStore: ApprovedMessageStore
    private lateinit var list: LinearLayout
    private val dateFormat = DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        pendingStore = EncryptedEventStore(this)
        approvedStore = ApprovedMessageStore(this)

        val padding = (20 * resources.displayMetrics.density).toInt()
        val page = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(padding, padding, padding, padding)
        }
        page.addView(TextView(this).apply {
            text = "수집 메시지 검토"
            textSize = 23f
        })
        page.addView(TextView(this).apply {
            text = "아래 메시지는 기기 안에 암호화된 임시 보관함에만 있습니다. ‘분석 대상으로 저장’을 눌러야 이후 관계 분석과 답장 추천에 사용할 수 있습니다."
            textSize = 15f
            setPadding(0, padding / 2, 0, padding)
        })

        val scroll = ScrollView(this)
        list = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        scroll.addView(list)
        page.addView(scroll, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            0,
            1f
        ))
        setContentView(page)
        renderMessages()
    }

    private fun renderMessages() {
        list.removeAllViews()
        val messages = pendingStore.loadRecent()
        if (messages.isEmpty()) {
            list.addView(TextView(this).apply {
                text = "검토할 임시 메시지가 없습니다."
                textSize = 16f
            })
            return
        }

        messages.forEach { message -> list.addView(createMessageCard(message)) }
    }

    private fun createMessageCard(message: CapturedMessage): LinearLayout {
        val density = resources.displayMetrics.density
        val margin = (12 * density).toInt()
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(margin, margin, margin, margin)
            setBackgroundColor(0xFFF3F6FC.toInt())
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = margin }

            addView(TextView(this@ReviewActivity).apply {
                text = message.sender ?: "보낸 사람 정보 없음"
                textSize = 16f
            })
            addView(TextView(this@ReviewActivity).apply {
                text = dateFormat.format(Date(message.receivedAt))
                textSize = 12f
            })
            addView(TextView(this@ReviewActivity).apply {
                text = message.text
                textSize = 16f
                setPadding(0, margin / 2, 0, margin / 2)
            })
            addView(Button(this@ReviewActivity).apply {
                text = "분석 대상으로 저장"
                setOnClickListener {
                    approvedStore.promote(message)
                    pendingStore.remove(message.id)
                    Toast.makeText(this@ReviewActivity, "분석 대상에 저장했습니다.", Toast.LENGTH_SHORT).show()
                    renderMessages()
                }
            })
        }
    }
}
