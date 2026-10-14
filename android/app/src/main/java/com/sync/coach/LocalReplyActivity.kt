package com.sync.coach

import android.app.Activity
import android.app.ActivityManager
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.SystemClock
import android.text.InputFilter
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
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
class LocalReplyActivity : Activity() {
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
            text = "Gemma E2B GPU용 .litertlm 파일을 선택하세요. 약 2GB를 앱에 복사합니다. 받은 메시지를 직접 입력하면 기기 안에서 답변 초안을 만듭니다. 이 화면의 입력과 결과는 저장하지 않습니다."
        })
        status = TextView(this).also { layout.addView(it) }
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
            text = "모델 불러오기"
            setOnClickListener { loadModel() }
        }.also { layout.addView(it) }
        input = EditText(this).apply {
            hint = "예: 친구에게 오늘 약속을 미루자고 답하고 싶어. 짧고 부드럽게 써줘."
            minLines = 3
            filters = arrayOf(InputFilter.LengthFilter(1000))
            inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_FLAG_MULTI_LINE
        }.also { layout.addView(it) }
        generate = Button(this).apply {
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
            textSize = 18f
            setTextIsSelectable(true)
        }.also { layout.addView(it) }
        setContentView(ScrollView(this).apply { addView(layout) })
        status.text = if (modelFile.exists()) "모델 파일 준비됨 · 불러오기를 눌러주세요." else "모델 파일 선택 필요"
        updateButtons()
    }

    override fun onStart() {
        super.onStart()
        visible = true
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
            require(hasModelHeader(partial))
            check(partial.renameTo(modelFile))
            "모델 파일 준비됨 · 불러오기를 눌러주세요."
        } finally {
            partial.delete()
        }
    }

    private fun loadModel() = startWork("모델 불러오는 중… 최초 실행은 시간이 걸릴 수 있습니다.") {
        releaseEngine()
        require(hasModelHeader(modelFile))
        val started = SystemClock.elapsedRealtime()
        Engine.setNativeMinLogSeverity(LogSeverity.ERROR)
        val candidate = Engine(EngineConfig(
            modelPath = modelFile.absolutePath,
            backend = Backend.GPU(),
            maxNumTokens = 2048,
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
        if (text.isEmpty()) { input.error = "메시지 또는 답변 요청을 입력하세요."; return }
        result.text = ""
        startWork("답변 생성 중…") {
            val currentEngine = requireNotNull(engine)
            val started = SystemClock.elapsedRealtime()
            val conversation = currentEngine.createConversation(ConversationConfig(
                systemInstruction = Contents.of("한국어 메신저 답변 작성 도우미입니다. 사용자의 요청에 맞는 짧은 답변 초안 하나만 작성하세요. 설명을 붙이지 말고, 주어지지 않은 일정이나 사실을 만들지 마세요."),
                maxOutputToken = 192,
                thinkingConfig = ThinkingConfig(enableThinking = false),
            ))
            val answer = try {
                synchronized(nativeLock) {
                    activeConversation = conversation
                    check(!cancelled.get())
                }
                conversation.sendMessage(text).toString()
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
                runOnUiThread { if (!isDestroyed && visible && !cancelled.get()) result.text = answer }
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

    private fun hasModelHeader(file: File): Boolean {
        if (!file.isFile) return false
        return file.inputStream().use { source ->
            val header = ByteArray(8)
            source.read(header) == 8 && header.contentEquals("LITERTLM".toByteArray(Charsets.US_ASCII))
        }
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
        choose.isEnabled = !busy
        load.isEnabled = !busy && modelFile.exists() && !ready
        generate.isEnabled = !busy && ready
        cancel.isEnabled = busy
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
