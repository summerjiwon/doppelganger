package com.sync.coach.capture

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.sync.coach.reply.Relationship
import java.io.File
import java.security.KeyStore
import java.util.UUID
import org.junit.After
import org.junit.Before
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class PersonalWritingStoreTest {
    private lateinit var raw: EncryptedEventStore
    private lateinit var store: PersonalWritingStore
    private lateinit var file: File
    private lateinit var alias: String

    @Before fun setup() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        alias = "writing-test-${UUID.randomUUID()}"
        file = File(context.filesDir, alias)
        raw = EncryptedEventStore(context, alias, alias)
        store = PersonalWritingStore(raw)
    }

    @After fun cleanup() {
        raw.clear()
        KeyStore.getInstance("AndroidKeyStore").apply { load(null); if (containsAlias(alias)) deleteEntry(alias) }
    }

    @Test fun legacyExamplesStayUnclassifiedUntilExplicitlyAssigned() {
        val legacy = CapturedMessage.fromJson("""{"id":"old","sourcePackage":"user-authored","sender":"나","text":"가상 예문","receivedAt":${System.currentTimeMillis()}}""")
        raw.append(legacy)
        assertNull(store.listExamples().single().relationship)
        assertTrue(store.assignRelationship("old", Relationship.WORK))
        assertEquals(Relationship.WORK, store.listExamples().single().relationship)
        assertEquals("가상 예문", store.listExamples().single().text)
        assertTrue(store.assignRelationship("old", null))
        assertNull(store.listExamples().single().relationship)
    }

    @Test fun newExamplesKeepRelationshipAndRemainEncrypted() {
        assertEquals(1, store.addLines("가상 테스트 문장\n가상 테스트 문장", Relationship.FRIEND))
        assertEquals(Relationship.FRIEND, store.listExamples().single().relationship)
        assertFalse(file.readText().contains("가상 테스트 문장"))
        store.remove(store.listExamples().single().id)
        assertTrue(store.listExamples().isEmpty())
        assertFalse(store.assignRelationship("missing", Relationship.WORK))
    }

    @Test fun otherSendersCannotBeUsedAsMyExamples() {
        raw.append(CapturedMessage("not-me", "com.kakao.talk", "상대", "가상 상대 문장", System.currentTimeMillis(), Relationship.WORK.name))
        assertTrue(store.listExamples().isEmpty())
        assertFalse(store.assignRelationship("not-me", Relationship.FRIEND))
    }
}
