import random
from types import SimpleNamespace
import unittest
from unittest.mock import Mock

from test_examples import EXAMPLES


def load(name, **values):
    namespace = dict(values)
    exec(compile(EXAMPLES[name]["python"], name, "exec"), namespace)
    return namespace


class NativeTeachingExamples(unittest.TestCase):
    def test_alloc_aux_rounding_and_first_region_priority(self):
        allocate = load("ch18-f3")["allocAux"]
        for size in [1, 7, 8, 9, 15, 16, 31, 32, 63, 64]:
            buffer = SimpleNamespace(
                firstAvailable=1024, availableLength=64, extraAppendBytes=64,
                getNewAllocation=Mock(side_effect=AssertionError("unexpected allocation")),
            )
            rounded = (size + 7) & ~7
            self.assertEqual(allocate(buffer, size), 1024 + 64 - rounded)
            self.assertEqual(buffer.availableLength, 64 - rounded)
            self.assertEqual(buffer.extraAppendBytes, 64)
            buffer.getNewAllocation.assert_not_called()

    def test_alloc_aux_last_chunk_path(self):
        allocate = load("ch18-f3")["allocAux"]
        buffer = SimpleNamespace(
            firstAvailable=1024, availableLength=8, extraAppendBytes=32,
            lastChunk=SimpleNamespace(data=2048, length=16),
            getNewAllocation=Mock(side_effect=AssertionError("unexpected allocation")),
        )
        self.assertEqual(allocate(buffer, 9), 2080)
        self.assertEqual(buffer.extraAppendBytes, 16)
        self.assertEqual(buffer.availableLength, 8)
        buffer.getNewAllocation.assert_not_called()

    def test_alloc_aux_new_region_path(self):
        allocate = load("ch18-f3")["allocAux"]
        buffer = SimpleNamespace(
            firstAvailable=1024, availableLength=8, extraAppendBytes=8,
            getNewAllocation=Mock(return_value=(4096, 64)),
        )
        self.assertEqual(allocate(buffer, 9), 4144)
        buffer.getNewAllocation.assert_called_once_with(16)
        self.assertEqual(buffer.firstAvailable, 4096)
        self.assertEqual(buffer.availableLength, 48)
        self.assertEqual(buffer.extraAppendBytes, 8)
        with self.assertRaises(AssertionError):
            allocate(buffer, 0)

    def test_old_buffer_allocation_and_chunk_merge_paths(self):
        namespace = load("ch20-f1")
        Allocation, Buffer = namespace["Allocation"], namespace["Buffer"]

        def allocation(base=1024, append=16, top=64):
            region = Allocation()
            region.data, region.appendTop, region.chunkTop = base, append, top
            return region

        region = allocation()
        self.assertEqual(region.allocateAppend(8), 1040)
        self.assertEqual(region.appendTop, 24)
        self.assertIsNone(region.allocateAppend(64))
        self.assertEqual(region.appendTop, 24)

        for internal, adjacent in [(True, True), (True, False), (False, True)]:
            buffer = Buffer()
            buffer.allocations = allocation()
            chunk = SimpleNamespace(
                data=1024 if adjacent else 2048, length=16,
                isInternal=lambda: internal,
            )
            buffer.chunksTail, buffer.totalLength = chunk, 16
            buffer.append = Mock()
            self.assertEqual(buffer.alloc(8), 1040)
            if internal and adjacent:
                self.assertEqual((chunk.length, buffer.totalLength), (24, 24))
                buffer.append.assert_not_called()
            else:
                self.assertEqual((chunk.length, buffer.totalLength), (16, 16))
                buffer.append.assert_called_once_with(1040, 8)

        for existing in [None, allocation(1024, 64, 64)]:
            buffer = Buffer()
            buffer.allocations = existing
            buffer.newAllocation = Mock(return_value=allocation(4096, 0, 64))
            self.assertEqual(buffer.allocateAppend(8), 4096)
            buffer.newAllocation.assert_called_once_with(0, 8)

    def test_new_buffer_fast_path_and_explicit_omission(self):
        allocate = load("ch20-f2")["alloc"]
        buffer = SimpleNamespace(
            availableAppendBytes=8, lastChunk=SimpleNamespace(data=4096, length=16),
            totalLength=32,
        )
        self.assertEqual(allocate(buffer, 8), 4112)
        self.assertEqual(buffer.lastChunk.length, 24)
        self.assertEqual(buffer.availableAppendBytes, 0)
        self.assertEqual(buffer.totalLength, 40)
        with self.assertRaises(NotImplementedError):
            allocate(buffer, 1)
        self.assertEqual(buffer.totalLength, 40)

    def test_packet_examples_preserve_all_three_error_paths(self):
        definitions = dict(
            DATA="data", GRANT="grant", RESEND="resend",
            DataHeader=object(), GrantHeader=object(), ResendHeader=object(),
            opcodeSymbol=lambda value: value,
        )
        for example in ["ch09-f1", "ch09-f2"]:
            namespace = load(example, **definitions)
            for opcode, type_name in [
                ("data", "DataHeader"), ("grant", "GrantHeader"), ("resend", "ResendHeader"),
            ]:
                for header in [None, object()]:
                    logger = namespace["logger"] = Mock()
                    received = SimpleNamespace(
                        getStart=Mock(return_value=header),
                        sender=SimpleNamespace(toString=lambda: "sender"), len=3,
                    )
                    namespace["handle"](SimpleNamespace(opcode=opcode), received)
                    received.getStart.assert_called_once_with(definitions[type_name])
                    if header is None:
                        logger.warning.assert_called_once_with(
                            "%s packet from %s too short (%d bytes)", opcode, "sender", 3,
                        )
                    else:
                        logger.warning.assert_not_called()
            received.getStart = Mock(side_effect=ValueError("unrelated failure"))
            with self.assertRaisesRegex(ValueError, "unrelated"):
                namespace["handle"](SimpleNamespace(opcode="data"), received)

    def test_utf8_counts_valid_invalid_and_truncated_sequences(self):
        cases = [
            (b"", 0), (b"abc", 3), ("\u00e9\u4e2d\U0001f600".encode(), 3),
            ("e\u0301".encode(), 2), (b"\xff", 1), (b"\xe2\x82", 2),
            (b"\xc0\xaf", 2), (b"\xed\xa0\x80", 3), (b"\xf4\x90\x80\x80", 4),
            (b"\xf0\x9f\x98\x80", 1), (b"\xf0\x9f\x98", 3), (b"\xe2A\x82", 3),
        ]
        cases += [(bytes([value]), 1) for value in range(256)]
        rng = random.Random(2026)
        for _ in range(500):
            value = rng.randbytes(rng.randrange(40))
            cases.append((value, len(value.decode("utf-8", "surrogateescape"))))
        for example in ["ch14-f7", "ch14-f8"]:
            count = load(example)["RuneCount"]
            for value, expected in cases:
                with self.subTest(example=example, value=value):
                    self.assertEqual(count(value), expected)

    def test_enum_alias_and_omitted_copy_behavior_are_disclosed(self):
        status = load("ch13-f21")["Status"]
        self.assertEqual(status.STATUS_INDEX_DOESNT_EXIST, 29)
        self.assertIs(status.STATUS_MAX_VALUE, status.STATUS_INVALID_PARAMETER)
        self.assertEqual(len(list(status)), 5)
        self.assertIn("aliases", EXAMPLES["ch13-f21"]["noteEn"])
        copy = load("ch13-f13")["copy"]
        self.assertIsNone(copy(object(), 0, 4, bytearray(4)))
        self.assertIn("returns None", EXAMPLES["ch13-f13"]["noteEn"])


if __name__ == "__main__":
    unittest.main()
