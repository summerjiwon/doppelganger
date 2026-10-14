package com.sync.coach

import android.app.Activity
import android.os.Bundle
import android.view.WindowManager
import android.view.View

/** Hides conversation contents from screenshots, recording and recent-app previews. */
open class PrivateActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        window.decorView.importantForAutofill = View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS
    }
}
