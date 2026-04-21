8.16. Phân quyền (Permission Matrix)

8.16.1. Màn hình phân quyền theo ma trận
Mục đích: Quản trị tập trung quyền hạn theo vai trò dưới dạng ma trận trực quan.
Các thao tác chính:

1. Mở menu Phân quyền.
2. Quan sát ma trận với trục dọc là nhóm quyền (model/belong_to), trục ngang là hành động.
3. Theo dõi trạng thái quyền bằng checkbox tại từng ô giao giữa nhóm quyền và hành động.
4. Nhận biết các ô không áp dụng quyền qua biểu tượng dấu trừ.

Kết quả mong đợi: Người vận hành có cái nhìn tổng thể về cấu hình quyền của từng vai trò trên một màn hình duy nhất.

Ảnh 1: Màn hình ma trận phân quyền

8.16.2. Chọn vai trò cần cấu hình quyền
Mục đích: Nạp đúng bộ quyền hiện tại của vai trò trước khi chỉnh sửa.
Các bước thực hiện:

1. Tại thanh công cụ, mở bộ lọc Vai trò.
2. Tìm vai trò theo từ khóa nếu cần.
3. Chọn một vai trò để thao tác (mỗi lần chỉ cấu hình một vai trò).
4. Quan sát hệ thống tự đánh dấu các quyền đã gán cho vai trò đó.

Kết quả mong đợi: Ma trận hiển thị chính xác trạng thái quyền hiện tại của vai trò được chọn.

Ảnh 2: Bộ lọc chọn vai trò phân quyền

8.16.3. Tìm kiếm nhóm quyền
Mục đích: Thu hẹp danh sách quyền khi dữ liệu nhiều, giúp thao tác nhanh và chính xác.
Các bước thực hiện:

1. Nhập từ khóa vào ô Tìm kiếm tên quyền hạn.
2. Quan sát bảng quyền được lọc theo tên nhóm quyền.
3. Dùng Reset để xóa điều kiện tìm kiếm khi cần quay lại toàn bộ dữ liệu.

Kết quả mong đợi: Chỉ các nhóm quyền phù hợp từ khóa được hiển thị trong ma trận.

Ảnh 3: Tìm kiếm nhóm quyền trong ma trận

8.16.4. Gán/bỏ gán quyền cho vai trò
Mục đích: Cập nhật tập quyền của vai trò theo yêu cầu vận hành và kiểm soát truy cập.
Các bước thực hiện:

1. Chọn vai trò cần cấu hình.
2. Tích checkbox tại các ô quyền cần gán.
3. Bỏ tích checkbox tại các ô quyền cần thu hồi.
4. Kiểm tra số lượng quyền đã chọn ở badge đếm.
5. Nhấn Lưu để ghi nhận cấu hình mới.

Kết quả mong đợi: Bộ quyền của vai trò được cập nhật thành công và hiển thị thông báo xác nhận.

Ảnh 4: Thao tác gán và bỏ gán quyền trên ma trận

8.16.5. Chọn tất cả / bỏ chọn tất cả quyền
Mục đích: Tăng tốc thao tác khi cần cấu hình hàng loạt quyền.
Các bước thực hiện:

1. Nhấn Chọn tất cả để bật toàn bộ quyền khả dụng trong ma trận hiện tại.
2. Nhấn Bỏ chọn tất cả để xóa toàn bộ lựa chọn.
3. Nhấn Lưu để áp dụng thay đổi cho vai trò.

Kết quả mong đợi: Quyền được chọn hoặc bỏ chọn đồng loạt theo thao tác người dùng.

Ảnh 5: Nút chọn tất cả và bỏ chọn tất cả quyền

8.16.6. Lưu cấu hình phân quyền
Mục đích: Ghi nhận thay đổi quyền xuống hệ thống backend theo vai trò/tenant.
Các bước thực hiện:

1. Hoàn tất thao tác chọn quyền trong ma trận.
2. Nhấn nút Lưu.
3. Chờ hệ thống xử lý và hiển thị trạng thái Đang lưu.
4. Kiểm tra thông báo thành công/thất bại sau khi lưu.

Kết quả mong đợi: Cấu hình quyền mới được lưu thành công và đồng bộ lại dữ liệu quyền của vai trò.

Ảnh 6: Nút lưu và trạng thái xử lý phân quyền

8.16.7. Trường hợp không áp dụng quyền
Mục đích: Giúp người vận hành tránh thao tác sai tại các ô không tồn tại quyền tương ứng.
Các bước thực hiện:

1. Di chuyển chuột vào ô có biểu tượng dấu trừ.
2. Xem tooltip cảnh báo Không áp dụng quyền này.
3. Bỏ qua ô này và chỉ thao tác trên ô có checkbox.

Kết quả mong đợi: Người dùng nhận biết rõ các tổ hợp quyền không hợp lệ và thao tác đúng vùng dữ liệu cho phép.

Ảnh 7: Tooltip tại ô không áp dụng quyền

8.17. Quy tắc truy cập màn hình phân quyền
Mục đích: Đảm bảo chỉ người dùng được cấp quyền phù hợp mới truy cập trang phân quyền.
Nguyên tắc áp dụng:

- Route `/permissions` được bảo vệ bởi `ProtectedRoute`.
- Điều kiện truy cập bắt buộc: quyền `VIEW_PERMISSIONS`.
- Dữ liệu phân quyền lưu theo vai trò và ràng buộc tenant hiện tại.

Kết quả mong đợi: Màn hình phân quyền chỉ hiển thị cho đúng đối tượng có thẩm quyền, giảm rủi ro thay đổi quyền trái phép.
