package com.sync.coach.capture

import android.content.Context
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import java.io.File
import java.io.IOException
import java.security.KeyStore
import java.util.UUID
import java.util.concurrent.Callable
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/** Synthetic fixtures only; never opens the user's real inbox or key aliases. */
@RunWith(AndroidJUnit4::class)
class EncryptedEventStoreTest {
    private lateinit var context: Context
    private lateinit var fileName: String
    private lateinit var alias: String
    private lateinit var file: File

    @Before fun prepare() {
        context = InstrumentationRegistry.getInstrumentation().targetContext
        fileName = "security-test-${UUID.randomUUID()}"
        alias = fileName
        file = File(context.filesDir, fileName)
    }

    private fun store() = EncryptedEventStore(context, fileName, alias, 100, Long.MAX_VALUE)
    private fun message(id: String) = CapturedMessage(id, "test-only", "fixture", "synthetic-private-$id", System.currentTimeMillis())

    @After fun cleanup() {
        store().clear()
        KeyStore.getInstance("AndroidKeyStore").apply { load(null); if (containsAlias(alias)) deleteEntry(alias) }
    }

    @Test fun concurrentInstancesPreserveAllMessagesAndDeduplicateIds() {
        val pool = Executors.newFixedThreadPool(4)
        try {
            val tasks = (0..3).map { worker -> Callable {
                repeat(10) { i -> store().append(message("$worker-$i")) }
                store().append(message("shared-id"))
            } }
            pool.invokeAll(tasks, 60, TimeUnit.SECONDS).forEach { it.get() }
            val records = store().loadRecent()
            assertEquals(41, records.size)
            assertEquals(41, records.map { it.id }.toSet().size)
            assertFalse(file.readText().contains("synthetic-private"))
        } finally { pool.shutdownNow() }
    }

    @Test fun damagedRecordIsNotSilentlyDeletedByReadOrAppend() {
        store().append(message("first"))
        file.appendText("invalid-encrypted-record\n")
        val before = file.readBytes()
        assertThrows(IOException::class.java) { store().loadRecent() }
        assertArrayEquals(before, file.readBytes())
        assertThrows(IOException::class.java) { store().append(message("second")) }
        assertArrayEquals(before, file.readBytes())
    }

    @Test fun missingKeyDoesNotOverwriteCiphertextOrGenerateReplacementKey() {
        store().append(message("first"))
        val before = file.readBytes()
        KeyStore.getInstance("AndroidKeyStore").apply { load(null); deleteEntry(alias) }
        assertThrows(IOException::class.java) { store().append(message("second")) }
        assertArrayEquals(before, file.readBytes())
        assertFalse(KeyStore.getInstance("AndroidKeyStore").apply { load(null) }.containsAlias(alias))
    }

    @Test fun backupRecoveryKeepsExistingCiphertextFormatReadable() {
        store().append(message("legacy-format"))
        check(file.renameTo(File(file.path + ".bak")))
        assertEquals("legacy-format", store().loadRecent().single().id)
    }
}
