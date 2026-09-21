import unittest

from localize import localize_svg, translate


class ReaderLocalization(unittest.TestCase):
    def test_view_and_achievement_senses_stay_distinct(self):
        for source, expected in [
            ("同一文件的多个视图", "同一檔案的多個視圖"),
            ("插入光标和视图的变化", "插入游標和視圖的變化"),
            ("查看代码", "查看程式碼"),
            ("简化视图", "簡化視圖"),
            ("实现这一目标", "達成這一目標"),
            ("实现真正的目标", "達成真正的目標"),
            ("实现高性能", "達到高效能"),
            ("实现模块", "實作模組"),
            ("实现方法", "實作方法"),
        ]:
            with self.subTest(source=source):
                self.assertEqual(translate(source), expected)

    def test_test_pass_is_not_translated_as_through(self):
        for source, expected in [
            ("通过的测试", "通過的測試"),
            ("修复版本通过，还缺少什么？", "修復版本通過，還缺少什麼？"),
            ("若只在修复版通过", "若只在修復版通過"),
            ("修复版本的通过结果", "修復版本的通過結果"),
            ("返回 C = 期望 C → 通过", "回傳 C = 期望 C → 通過"),
            ("通过这一测试不证明全部正确", "通過這一測試不證明全部正確"),
            ("通过接口读取", "透過介面讀取"),
            ("修复版通过接口读取", "修復版透過介面讀取"),
            ("代码通过检查后才能提交到仓库", "程式碼通過檢查後才能提交到儲存庫"),
        ]:
            with self.subTest(source=source):
                self.assertEqual(translate(source), expected)

    def test_svg_identifiers_and_geometry_are_not_localized(self):
        source = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 500"><title id="代码">代码</title><text x="20" y="40">通过的测试</text></svg>'
        result = localize_svg(source)
        self.assertIn('id="代码"', result)
        self.assertIn('viewBox="0 0 360 500"', result)
        self.assertIn('x="20" y="40"', result)
        self.assertIn("通過的測試", result)
        self.assertIn("程式碼</title>", result)

    def test_reader_review_contexts_and_actual_api_terms(self):
        for source, expected in [
            ("仓库", "儲存庫"),
            ("库存导出", "庫存匯出"),
            ("库存字段", "庫存欄位"),
            ("库存输出", "庫存輸出"),
            ("联系人、库存、", "聯絡人、庫存、"),
            ("库存: if comma(f): quote(f)", "庫存: if comma(f): quote(f)"),
            ("标准库 logging", "標準函式庫 logging"),
            ("相关刷新与持久化保证", "相關資料寫出（flush）與持久化保證"),
            ("完整 Buffer 不变量", "完整 Buffer 不變條件"),
            ("不变量含义，不是每次重算：", "不變條件含義，不是每次重算："),
            ("不变数值", "不變數值"),
            ("不变数量", "不變數量"),
            ("右侧回路返回赶任务", "右側迴路回到趕任務"),
            ("通过回箭头返回接口说明", "透過回箭頭回到介面說明"),
            ("问题可返回接口说明", "問題可回到介面說明"),
            ("LF 后返回检查", "LF 後回到檢查"),
            ("修复，再返回检查。", "修復，再回到檢查。"),
            ("满足同一契约，返回同一编码器得到", "滿足同一契約，回到同一編碼器得到"),
            ("返回 C", "回傳 C"),
            ("返回 None", "回傳 None"),
            ("说明支持接口简单的判断", "說明支持介面簡單的判斷"),
            ("这支持测试覆盖了该回归", "這支持測試覆蓋了該回歸"),
            ("支持覆盖了这条回归", "支持覆蓋了這條迴歸"),
            ("支持覆盖这一条回归", "支持覆蓋這一條迴歸"),
            ("不支持的 pickle 协议", "不支援的 pickle 協議"),
            ("也不把前三项通过画成已追加成功。", "也不把前三項通過畫成已追加成功。"),
            ("再用逗号连接字段。", "再用逗號串接欄位。"),
            ("网络连接", "網路連線"),
            ("说明复制与引用，失效方式不同", "說明複製與引用，失效方式不同"),
            ("同一个后置条件并成功", "同一個後置條件並成功"),
            ("不合并两条消息", "不合併兩條訊息"),
        ]:
            with self.subTest(source=source):
                self.assertEqual(translate(source), expected)


if __name__ == "__main__":
    unittest.main()
