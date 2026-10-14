package com.sync.coach

import android.view.View
import android.view.WindowManager
import android.widget.EditText
import android.widget.Spinner
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.sync.coach.reply.ReplyIntent
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ReplySelectionUiTest {
    @Test fun privateDialogsProtectTheirOwnWindow() {
        ActivityScenario.launch(LocalReplyActivity::class.java).use { scenario ->
            scenario.onActivity { activity ->
                val dialog = android.app.AlertDialog.Builder(activity).setMessage("가상 예문").showPrivate()
                try { assertTrue(requireNotNull(dialog.window).attributes.flags and WindowManager.LayoutParams.FLAG_SECURE != 0) }
                finally { dialog.dismiss() }
            }
        }
    }

    @Test fun selectionStartsExplicitAndCustomFieldFollowsIntent() {
        ActivityScenario.launch(LocalReplyActivity::class.java).use { scenario ->
            scenario.onActivity { activity ->
                val root = activity.window.decorView
                assertEquals(0, root.findViewWithTag<Spinner>("relationship").selectedItemPosition)
                assertEquals(0, root.findViewWithTag<Spinner>("reply_intent").selectedItemPosition)
                assertEquals(View.GONE, root.findViewWithTag<EditText>("custom_intent").visibility)
                assertTrue(activity.window.attributes.flags and WindowManager.LayoutParams.FLAG_SECURE != 0)
                root.findViewWithTag<Spinner>("reply_intent").setSelection(ReplyIntent.CUSTOM.ordinal + 1)
            }
            InstrumentationRegistry.getInstrumentation().waitForIdleSync()
            scenario.onActivity { activity ->
                val root = activity.window.decorView
                assertEquals(View.VISIBLE, root.findViewWithTag<EditText>("custom_intent").visibility)
                root.findViewWithTag<Spinner>("reply_intent").setSelection(ReplyIntent.DECLINE.ordinal + 1)
            }
            InstrumentationRegistry.getInstrumentation().waitForIdleSync()
            scenario.onActivity { activity ->
                assertEquals(View.GONE, activity.window.decorView.findViewWithTag<EditText>("custom_intent").visibility)
            }
        }
    }
}
