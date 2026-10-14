package com.sync.coach

import android.app.AlertDialog
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import com.sync.coach.capture.PersonalWritingStore
import com.sync.coach.reply.Relationship

/** Explicit classification of existing examples; never guesses a relationship. */
class WritingExamplesActivity : PrivateActivity() {
    private lateinit var store: PersonalWritingStore
    private lateinit var list: LinearLayout
    private lateinit var heading: TextView
    private lateinit var previous: Button
    private lateinit var next: Button
    private var pageIndex = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        store = PersonalWritingStore(this)
        val padding = (20 * resources.displayMetrics.density).toInt()
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(padding, padding, padding, padding)
        }
        heading = TextView(this).apply { textSize = 20f }.also { layout.addView(it) }
        layout.addView(TextView(this).apply {
            text = "내가 쓴 문장에 관계를 지정하세요. 기존 문장은 미분류로 유지되며, 관계를 지정하고 생성 화면에서 선택해야 답변에 참고됩니다."
        })
        list = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        layout.addView(ScrollView(this).apply { addView(list) }, LinearLayout.LayoutParams(-1, 0, 1f))
        previous = Button(this).apply { text = "이전 50개"; setOnClickListener { pageIndex--; render() } }.also { layout.addView(it) }
        next = Button(this).apply { text = "다음 50개"; setOnClickListener { pageIndex++; render() } }.also { layout.addView(it) }
        setContentView(layout)
        render()
    }

    private fun render() {
        list.removeAllViews()
        val examples = try { store.listExamples() } catch (_: Exception) {
            heading.text = "보관함을 읽을 수 없습니다. 기존 데이터는 유지됩니다."
            previous.isEnabled = false; next.isEnabled = false
            return
        }
        pageIndex = pageIndex.coerceIn(0, (examples.size - 1).coerceAtLeast(0) / 50)
        heading.text = "내 말투 예문 ${examples.size}개 · 미분류 ${examples.count { it.relationship == null }}개"
        previous.isEnabled = pageIndex > 0
        next.isEnabled = (pageIndex + 1) * 50 < examples.size
        if (examples.isEmpty()) list.addView(TextView(this).apply { text = "저장된 본인 문장이 없습니다." })
        examples.drop(pageIndex * 50).take(50).forEach { example ->
            list.addView(TextView(this).apply { text = example.text; textSize = 16f; setPadding(0, 24, 0, 8) })
            list.addView(Button(this).apply {
                text = "관계: ${example.relationship?.label ?: "미분류"} · 변경"
                setOnClickListener {
                    var selected = example.relationship?.ordinal?.plus(1) ?: 0
                    AlertDialog.Builder(this@WritingExamplesActivity)
                        .setTitle("이 문장을 사용한 관계")
                        .setSingleChoiceItems((listOf("미분류") + Relationship.entries.map { it.label }).toTypedArray(), selected) { _, which -> selected = which }
                        .setPositiveButton("저장") { _, _ ->
                            val saved = runCatching { store.assignRelationship(example.id, Relationship.entries.getOrNull(selected - 1)) }.getOrDefault(false)
                            if (!saved) Toast.makeText(this@WritingExamplesActivity, "분류하지 못했습니다. 다시 확인해주세요.", Toast.LENGTH_SHORT).show()
                            render()
                        }.setNegativeButton("취소", null).showPrivate()
                }
            })
            list.addView(Button(this).apply {
                text = "이 예문 삭제"
                setOnClickListener {
                    AlertDialog.Builder(this@WritingExamplesActivity)
                        .setTitle("이 예문을 삭제할까요?")
                        .setMessage("삭제하면 다음 답변 생성의 참고 예문에서 제외됩니다.")
                        .setPositiveButton("삭제") { _, _ ->
                            if (runCatching { store.remove(example.id) }.isFailure) Toast.makeText(this@WritingExamplesActivity, "삭제하지 못했습니다.", Toast.LENGTH_SHORT).show()
                            render()
                        }.setNegativeButton("취소", null).showPrivate()
                }
            })
        }
    }
}
