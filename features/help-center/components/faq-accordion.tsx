"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const faqSections = [
  {
    category: "Bắt đầu",
    questions: [
      {
        question: "Làm thế nào để tạo tài khoản?",
        answer:
          "Để tạo tài khoản, nhấn nút 'Đăng ký' ở góc trên bên phải. Bạn cần nhập địa chỉ email và tạo mật khẩu. Sau khi xác minh email, bạn có thể sử dụng đầy đủ các tính năng.",
      },
      {
        question: "Gói miễn phí có những tính năng gì?",
        answer:
          "Gói miễn phí bao gồm các tính năng cơ bản như tạo tối đa 10 dự án, 5GB dung lượng lưu trữ và hỗ trợ từ cộng đồng. Để dùng tính năng nâng cao như dự án không giới hạn, hỗ trợ ưu tiên và truy cập API, hãy nâng cấp lên gói trả phí.",
      },
      {
        question: "Làm sao để bắt đầu dự án đầu tiên?",
        answer:
          "Sau khi đăng ký, vào bảng điều khiển và nhấn 'Tạo dự án mới'. Làm theo trình hướng dẫn để cấu hình dự án, mời thành viên nhóm và bắt đầu làm việc.",
      },
    ],
  },
  {
    category: "Tài khoản & Cài đặt",
    questions: [
      {
        question: "Làm thế nào để đổi mật khẩu?",
        answer:
          "Vào Cài đặt > Bảo mật > Đổi mật khẩu. Nhập mật khẩu hiện tại và mật khẩu mới hai lần. Mật khẩu mới nên có ít nhất 8 ký tự, gồm chữ, số và ký tự đặc biệt.",
      },
      {
        question: "Tôi có thể đổi địa chỉ email không?",
        answer:
          "Có, bạn có thể đổi email tại Cài đặt > Tài khoản > Email. Bạn cần xác minh email mới trước khi nó được kích hoạt. Hãy kiểm tra cả thư mục spam nếu không thấy email xác minh.",
      },
      {
        question: "Làm sao để bật xác thực hai yếu tố?",
        answer:
          "Vào Cài đặt > Bảo mật > Xác thực hai yếu tố và nhấn 'Bật'. Quét mã QR bằng ứng dụng xác thực như Google Authenticator hoặc Authy. Lưu mã dự phòng ở nơi an toàn.",
      },
    ],
  },
  {
    category: "Thanh toán & Gói dịch vụ",
    questions: [
      {
        question: "Bạn chấp nhận những phương thức thanh toán nào?",
        answer:
          "Chúng tôi chấp nhận các thẻ tín dụng phổ biến (Visa, Mastercard, American Express), PayPal và chuyển khoản ngân hàng cho gói theo năm. Mọi giao dịch được xử lý an toàn qua đối tác thanh toán.",
      },
      {
        question: "Tôi có thể hủy gói đăng ký bất cứ lúc nào không?",
        answer:
          "Có, bạn có thể hủy gói bất cứ lúc nào tại Cài đặt > Thanh toán. Gói vẫn hoạt động đến hết chu kỳ thanh toán hiện tại và bạn tiếp tục dùng đầy đủ tính năng trong thời gian đó.",
      },
      {
        question: "Bạn có hoàn tiền không?",
        answer:
          "Chúng tôi có chính sách hoàn tiền trong 30 ngày cho gói đăng ký mới. Nếu không hài lòng trong 30 ngày đầu, liên hệ đội hỗ trợ để được hoàn tiền toàn bộ. Gói theo năm được hoàn tiền theo tỷ lệ thời gian chưa sử dụng.",
      },
    ],
  },
];

export function FAQAccordion() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">
        Câu hỏi thường gặp
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        {faqSections.map((section) => (
          <Card key={section.category}>
            <CardHeader>
              <CardTitle className="text-lg">{section.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {section.questions.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`${section.category}-${index}`}
                  >
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-sm">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
