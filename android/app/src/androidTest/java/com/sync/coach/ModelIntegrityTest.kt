package com.sync.coach

import org.junit.Assert.assertThrows
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.runner.RunWith
import androidx.test.ext.junit.runners.AndroidJUnit4

@RunWith(AndroidJUnit4::class)
class ModelIntegrityTest {
    @get:Rule val folder = TemporaryFolder()
    private val abcHash = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"

    @Test fun matchingFileIsAccepted() {
        val file = folder.newFile().apply { writeText("abc") }
        ModelIntegrity.verifyAgainst(file, 3, abcHash)
    }

    @Test fun sameSizeTamperedFileIsRejected() {
        val file = folder.newFile().apply { writeText("abd") }
        assertThrows(IllegalArgumentException::class.java) {
            ModelIntegrity.verifyAgainst(file, 3, abcHash)
        }
    }

    @Test fun arbitraryModelAndCancelledVerificationAreRejected() {
        val file = folder.newFile().apply { writeText("abc") }
        assertThrows(IllegalArgumentException::class.java) { ModelIntegrity.verify(file) }
        assertThrows(IllegalStateException::class.java) {
            ModelIntegrity.verifyAgainst(file, 3, abcHash) { true }
        }
    }
}
