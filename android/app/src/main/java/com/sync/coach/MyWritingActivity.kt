package com.sync.coach

import android.app.Activity
import android.os.Bundle
import android.text.InputType
import android.view.Gravity
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import com.sync.coach.capture.PersonalWritingStore

/** Explicit, user-controlled seed data for personal tone matching. */
class MyWritingActivity : Activity() {
    private lateinit var writingStore: PersonalWritingStore
    private lateinit var countLabel: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        writingStore = PersonalWritingStore(this)

        val padding = (20 * resources.displayMetrics.density).toInt()
        val page = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(padding, padding, padding, padding)
        }
        page.addView(TextView(this).apply {
            text = "내 말투 문장 추가"
            textSize = 23f
        })
        page.addView(TextView(this).apply {
            text = "직접 쓴 카카오톡 문장만 넣어주세요. 한 줄을 한 문장으로 저장하며, 이후 추천 답장의 어미·길이·이모지 사용·격식을 맞추는 데만 사용됩니다. 상대방 메시지는 넣지 않아도 됩니다."
            textSize = 15f
            setPadding(0, padding / 2, 0, padding / 2)
        })

        countLabel = TextView(this).apply { textSize = 14f }
        page.addView(countLabel)

        val input = EditText(this).apply {
            hint = "예시\n오늘은 좀 피곤해서 이따 답할게 ㅠㅠ\n오키 그럼 토요일에 보자!\n확인했습니다. 오후까지 공유드리겠습니다."
            gravity = Gravity.TOP or Gravity.START
            minLines = 7
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_FLAG_MULTI_LINE or InputType.TYPE_TEXT_FLAG_CAP_SENTENCES
            setPadding(padding / 2, padding / 2, padding / 2, padding / 2)
        }
        page.addView(input, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            0,
            1f
        ))
        page.addView(Button(this).apply {
            text = "내 말투 데이터로 저장"
            setOnClickListener {
                val added = writingStore.addLines(input.text.toString())
                if (added == 0) {
                    Toast.makeText(this@MyWritingActivity, "저장할 문장을 입력해주세요.", Toast.LENGTH_SHORT).show()
                    return@setOnClickListener
                }
                input.setText("")
                renderCount()
                Toast.makeText(this@MyWritingActivity, "${added}개 문장을 내 말투 데이터에 저장했습니다.", Toast.LENGTH_SHORT).show()
            }
        })
        setContentView(page)
        renderCount()
    }

    private fun renderCount() {
        countLabel.text = "현재 내 말투 데이터: ${writingStore.count()}개 문장"
    }
}
