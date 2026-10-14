package com.sync.coach

import android.app.ActivityManager
import android.app.AlertDialog
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.SystemClock
import android.text.InputFilter
import android.view.View
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Spinner
import android.widget.Toast
import com.sync.coach.capture.PersonalWritingStore
import com.sync.coach.reply.ExampleSelection
import com.sync.coach.reply.Relationship
import com.sync.coach.reply.ReplyIntent
import com.sync.coach.reply.ReplyRequest
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.Conversation
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.LogSeverity
import com.google.ai.edge.litertlm.ThinkingConfig
import java.io.File
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

/** A foreground-only inference experiment. No captured messages are read here. */
class LocalReplyActivity : PrivateActivity() {
    private val worker = Executors.newSingleThreadExecutor()
    private val cancelled = AtomicBoolean(false)
    private val nativeLock = Any()
    private var engine: Engine? = null // Accessed only by the single worker.
    private var activeConversation: Conversation? = null // Guarded by nativeLock.
    private var busy = false
    private var ready = false
    @Volatile private var visible = false
    private lateinit var status: TextView
    private lateinit var result: TextView
    private lateinit var input: EditText
    private lateinit var relationship: Spinner
    private lateinit var intent: Spinner
    private lateinit var customIntent: EditText
    private lateinit var selectionSummary: TextView
    private lateinit var exampleButton: Button
    private lateinit var manageExamples: Button
    private val selectedExampleIds = linkedSetOf<String>()
    private lateinit var choose: Button
    private lateinit var load: Button
    private lateinit var generate: Button
    private lateinit var cancel: Button
    private val modelFile get() = File(filesDir, "local-reply.litertlm")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val padding = (20 * resources.displayMetrics.density).toInt()
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(padding, padding, padding, padding)
        }
        layout.addView(TextView(this).apply {
            text = "로컬 AI 답변 테스트"
            textSize = 24f
        })
        layout.addView(TextView(this).apply {
            text = "관계·의도를 고르고 내 말투 예문을 최대 5개 선택하세요. 선택한 예문에서 문장당 최대 120자를 말투 참고에 사용합니다. 새 입력과 생성 결과는 저장하지 않습니다."
        })
        status = TextView(this).apply { tag = "reply_status" }.also { layout.addView(it) }
        choose = Button(this).apply {
            text = "모델 파일 선택"
            setOnClickListener {
                startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                    type = "*/*"
                    addCategory(Intent.CATEGORY_OPENABLE)
                }, MODEL_REQUEST)
            }
        }.also { layout.addView(it) }
        load = Button(this).apply {
            tag = "load_model"
            text = "모델 불러오기"
            setOnClickListener { loadModel() }
        }.also { layout.addView(it) }
        layout.addView(TextView(this).apply { text = "상대와의 관계" })
        relationship = Spinner(this).apply {
            tag = "relationship"
            adapter = ArrayAdapter(this@LocalReplyActivity, android.R.layout.simple_spinner_dropdown_item,
                listOf("관계 선택") + Relationship.entries.map { it.label })
        }.also { layout.addView(it) }
        exampleButton = Button(this).apply {
            tag = "select_examples"
            text = "내 말투 예문 선택 (0/5)"
            setOnClickListener { selectExamples() }
        }.also { layout.addView(it) }
        manageExamples = Button(this).apply {
            text = "내 예문 추가·관계 분류"
            setOnClickListener { startActivity(Intent(this@LocalReplyActivity, MyWritingActivity::class.java)) }
        }.also { layout.addView(it) }
        layout.addView(TextView(this).apply { text = "원하는 답변 의도" })
        intent = Spinner(this).apply {
            tag = "reply_intent"
            adapter = ArrayAdapter(this@LocalReplyActivity, android.R.layout.simple_spinner_dropdown_item,
                listOf("의도 선택") + ReplyIntent.entries.map { it.label })
        }.also { layout.addView(it) }
        customIntent = EditText(this).apply {
            tag = "custom_intent"
            hint = "예: 오늘은 어렵지만 대화는 이어가고 싶어."
            filters = arrayOf(InputFilter.LengthFilter(300))
            imeOptions = android.view.inputmethod.EditorInfo.IME_FLAG_NO_PERSONALIZED_LEARNING
            visibility = View.GONE
        }.also { layout.addView(it) }
        layout.addView(TextView(this).apply { text = "받은 메시지" })
        input = EditText(this).apply {
            tag = "incoming_message"
            imeOptions = android.view.inputmethod.EditorInfo.IME_FLAG_NO_PERSONALIZED_LEARNING
            hint = "예: 오늘 저녁에 시간 있어?"
            minLines = 3
            filters = arrayOf(InputFilter.LengthFilter(1000))
            inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_FLAG_MULTI_LINE
        }.also { layout.addView(it) }
        generate = Button(this).apply {
            tag = "generate_reply"
            text = "답변 생성"
            setOnClickListener { generateReply() }
        }.also { layout.addView(it) }
        cancel = Button(this).apply {
            text = "취소"
            setOnClickListener {
                cancelWork()
                status.text = "취소 요청됨 · 실행 중인 로딩/작업이 정리될 때까지 기다려주세요."
                isEnabled = false
            }
        }.also { layout.addView(it) }
        result = TextView(this).apply {
            tag = "reply_result"
            textSize = 18f
            setTextIsSelectable(true)
        }.also { layout.addView(it) }
        selectionSummary = TextView(this).also { layout.addView(it) }
        val selectionListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                if (parent === relationship) {
                    selectedExampleIds.clear()
                    updateButtons()
                }
                customIntent.visibility = if (intent.selectedItemPosition == ReplyIntent.CUSTOM.ordinal + 1) View.VISIBLE else View.GONE
                clearPreview()
            }
            override fun onNothingSelected(parent: AdapterView<*>?) = Unit
        }
        relationship.onItemSelectedListener = selectionListener
        intent.onItemSelectedListener = selectionListener
        setContentView(ScrollView(this).apply { addView(layout) })
        status.text = if (modelFile.exists()) "모델 파일 준비됨 · 불러오기를 눌러주세요." else "모델 파일 선택 필요"
        updateButtons()
    }

    override fun onStart() {
        super.onStart()
        visible = true
    }

    override fun onResume() {
        super.onResume()
        if (selectedExampleIds.isNotEmpty()) {
            val selectedRelationship = Relationship.entries.getOrNull(relationship.selectedItemPosition - 1)
            val valid = runCatching {
                ExampleSelection.resolve(selectedExampleIds, PersonalWritingStore(this).listExamples(), requireNotNull(selectedRelationship))
            }.isSuccess
            if (!valid) {
                selectedExampleIds.clear()
                clearPreview()
                status.text = "예문이 변경되었거나 읽을 수 없습니다. 다시 선택해주세요."
            }
        }
        updateButtons()
    }

    private fun selectExamples() {
        val selectedRelationship = Relationship.entries.getOrNull(relationship.selectedItemPosition - 1) ?: return
        val examples = try {
            PersonalWritingStore(this).listExamples().filter { it.relationship == selectedRelationship }
        } catch (_: Exception) {
            status.text = "말투 보관함을 읽을 수 없습니다. 기존 데이터는 유지됩니다."
            return
        }
        if (examples.isEmpty()) {
            AlertDialog.Builder(this).setTitle("${selectedRelationship.label} 예문이 없습니다")
                .setMessage("내 예문 추가·관계 분류에서 문장을 추가하거나 기존 미분류 문장의 관계를 지정하세요. 예문 없이도 기본 말투로 생성할 수 있습니다.")
                .setPositiveButton("확인", null).showPrivate()
            return
        }
        val staged = selectedExampleIds.toMutableSet().apply { retainAll(examples.map { it.id }.toSet()) }
        AlertDialog.Builder(this).setTitle("${selectedRelationship.label} 예문 선택 · 최대 5개")
            .setMultiChoiceItems(examples.map { it.text.take(120) }.toTypedArray(), BooleanArray(examples.size) { examples[it].id in staged }) { dialog, which, checked ->
                val id = examples[which].id
                if (!checked) staged.remove(id)
                else if (staged.size < 5) staged.add(id)
                else {
                    (dialog as AlertDialog).listView.setItemChecked(which, false)
                    Toast.makeText(this, "예문은 최대 5개까지 선택할 수 있습니다.", Toast.LENGTH_SHORT).show()
                }
            }.setPositiveButton("적용") { _, _ ->
                selectedExampleIds.clear()
                selectedExampleIds.addAll(staged)
                clearPreview()
                updateButtons()
            }.setNegativeButton("취소", null).showPrivate()
    }

    @Deprecated("Uses the platform document picker to keep this experiment dependency-light")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == MODEL_REQUEST && resultCode == RESULT_OK) {
            data?.data?.let(::importModel)
        }
    }

    private fun startWork(message: String, work: () -> String) {
        if (busy) return
        busy = true
        cancelled.set(false)
        status.text = message
        updateButtons()
        worker.execute {
            val outcome = try {
                work()
            } catch (_: OutOfMemoryError) {
                releaseEngine()
                "메모리가 부족합니다. 다른 앱을 닫거나 더 작은 모델을 사용하세요."
            } catch (_: Exception) {
                // Native exception messages can include prompt text: never log or display them.
                if (cancelled.get()) {
                    "취소되었습니다."
                } else {
                    releaseEngine()
                    "실행 실패 · 모델 형식, 기기 GPU 지원, 여유 공간을 확인하고 다시 시도하세요."
                }
            } catch (_: LinkageError) {
                releaseEngine()
                "이 기기에서는 실행 라이브러리를 사용할 수 없습니다. arm64 Android 기기가 필요합니다."
            }
            runOnUiThread {
                if (!isDestroyed) {
                    busy = false
                    status.text = outcome
                    updateButtons()
                }
            }
        }
    }

    private fun importModel(uri: Uri) = startWork("모델을 기기에 복사 중…") {
        releaseEngine()
        val partial = File(filesDir, "local-reply.litertlm.part")
        try {
            require(modelFile.parentFile!!.usableSpace > 512L * 1024 * 1024)
            contentResolver.openInputStream(uri).use { source ->
                requireNotNull(source)
                partial.outputStream().use { target ->
                    val buffer = ByteArray(1024 * 1024)
                    while (true) {
                        check(!cancelled.get())
                        val read = source.read(buffer)
                        if (read < 0) break
                        check(partial.parentFile!!.usableSpace > read + 64L * 1024 * 1024)
                        target.write(buffer, 0, read)
                    }
                }
            }
            check(!cancelled.get())
            ModelIntegrity.verify(partial) { cancelled.get() }
            check(partial.renameTo(modelFile))
            "모델 파일 준비됨 · 불러오기를 눌러주세요."
        } finally {
            partial.delete()
        }
    }

    private fun loadModel() = startWork("모델 무결성 확인 및 로딩 중… 잠시 기다려주세요.") {
        releaseEngine()
        val started = SystemClock.elapsedRealtime()
        ModelIntegrity.verify(modelFile) { cancelled.get() || !visible }
        Engine.setNativeMinLogSeverity(LogSeverity.ERROR)
        val candidate = Engine(EngineConfig(
            modelPath = modelFile.absolutePath,
            backend = Backend.GPU(),
            maxNumTokens = 4096,
            cacheDir = cacheDir.absolutePath,
        ))
        try {
            candidate.initialize()
            if (cancelled.get() || !visible) {
                if (candidate.isInitialized()) candidate.close()
                "모델 불러오기가 취소되었습니다."
            } else {
                engine = candidate
                ready = true
                "준비 완료 · 로딩 ${SystemClock.elapsedRealtime() - started}ms · ${memoryInfo()}"
            }
        } catch (failure: Throwable) {
            if (candidate.isInitialized()) candidate.close()
            throw failure
        }
    }

    private fun generateReply() {
        val text = input.text.toString().trim()
        if (relationship.selectedItemPosition == 0) { status.text = "상대와의 관계를 선택하세요."; return }
        if (intent.selectedItemPosition == 0) { status.text = "원하는 답변 의도를 선택하세요."; return }
        if (text.isEmpty()) { input.error = "받은 메시지를 입력하세요."; return }
        val selectedIntent = ReplyIntent.entries[intent.selectedItemPosition - 1]
        val detail = customIntent.text.toString().trim()
        if (selectedIntent == ReplyIntent.CUSTOM && detail.isEmpty()) {
            customIntent.error = "원하는 대응을 직접 입력하세요."
            return
        }
        val selectedRelationship = Relationship.entries[relationship.selectedItemPosition - 1]
        val examples = try {
            if (selectedExampleIds.isEmpty()) emptyList() else
                ExampleSelection.resolve(selectedExampleIds, PersonalWritingStore(this).listExamples(), selectedRelationship)
        } catch (_: Exception) {
            status.text = "선택한 예문을 확인할 수 없습니다. 예문을 다시 선택해주세요."
            return
        }
        val request = ReplyRequest(text, selectedRelationship, selectedIntent, detail, examples)
        clearPreview()
        startWork("답변 생성 중…") {
            val currentEngine = requireNotNull(engine)
            val started = SystemClock.elapsedRealtime()
            val conversation = currentEngine.createConversation(ConversationConfig(
                systemInstruction = Contents.of(request.systemInstruction()),
                maxOutputToken = 192,
                thinkingConfig = ThinkingConfig(enableThinking = false),
            ))
            val answer = try {
                synchronized(nativeLock) {
                    activeConversation = conversation
                    check(!cancelled.get())
                }
                conversation.sendMessage(request.userMessage()).toString()
            } finally {
                synchronized(nativeLock) {
                    activeConversation = null
                    conversation.close()
                }
            }
            if (cancelled.get() || !visible) {
                "생성이 취소되었습니다."
            } else {
                check(answer.isNotBlank())
                val reviewed = request.reviewDraft(answer)
                runOnUiThread {
                    if (!isDestroyed && visible && !cancelled.get()) {
                        result.text = reviewed.text
                        selectionSummary.text = "적용한 설정: ${request.relationship.label} · ${request.intent.label} · 내 예문 ${request.styleExamples.size}개" +
                            if (reviewed.usedFallback) "\n제공하지 않은 사유 표현이 감지돼 기본 거절문을 표시했습니다." else ""
                    }
                }
                "생성 완료 · ${SystemClock.elapsedRealtime() - started}ms · ${memoryInfo()}"
            }
        }
    }

    private fun memoryInfo(): String {
        val info = ActivityManager.MemoryInfo()
        (getSystemService(ACTIVITY_SERVICE) as ActivityManager).getMemoryInfo(info)
        val processMb = android.os.Debug.getPss() / 1024
        return "앱 PSS 약 ${processMb}MB / 기기 가용 ${info.availMem / 1024 / 1024}MB"
    }

    private fun cancelWork() {
        cancelled.set(true)
        synchronized(nativeLock) { activeConversation?.cancelProcess() }
    }

    private fun releaseEngine() {
        engine?.let { if (it.isInitialized()) it.close() }
        engine = null
        ready = false
    }

    private fun updateButtons() {
        relationship.isEnabled = !busy
        intent.isEnabled = !busy
        customIntent.isEnabled = !busy
        input.isEnabled = !busy
        exampleButton.isEnabled = !busy && relationship.selectedItemPosition > 0
        exampleButton.text = "내 말투 예문 선택 (${selectedExampleIds.size}/5)"
        manageExamples.isEnabled = !busy
        choose.isEnabled = !busy
        load.isEnabled = !busy && modelFile.exists() && !ready
        generate.isEnabled = !busy && ready
        cancel.isEnabled = busy
    }

    private fun clearPreview() {
        result.text = ""
        selectionSummary.text = ""
    }

    override fun onStop() {
        visible = false
        cancelWork()
        worker.execute {
            releaseEngine()
            runOnUiThread {
                if (!isDestroyed) {
                    status.text = "모델 메모리 해제됨 · 다시 불러오기를 눌러주세요."
                    updateButtons()
                }
            }
        }
        super.onStop()
    }

    override fun onDestroy() {
        worker.shutdown() // Already queued cleanup completes; do not interrupt native teardown.
        super.onDestroy()
    }

    companion object { private const val MODEL_REQUEST = 20 }
}
