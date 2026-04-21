8.8. Quản lý người dùng

8.8.1. Danh sách người dùng
Mục đích: Tra cứu và quản lý tài khoản người dùng trong hệ thống theo từng tenant.
Các thao tác chính:

1. Mở menu Quản lý người dùng.
2. Quan sát các cột thông tin: Thông tin tài khoản (username, email), Họ tên người dùng, Vai trò, Cấp bậc, Trạng thái, Hành động.
3. Theo dõi trạng thái tài khoản (Hoạt động/Không hoạt động) để phục vụ vận hành.
4. Sử dụng cột Hành động để thực hiện Sửa hoặc Xóa người dùng.

Kết quả mong đợi: Người vận hành nắm được toàn bộ danh sách tài khoản và có thể thao tác quản trị trực tiếp trên từng dòng dữ liệu.

Ảnh 1: Màn hình danh sách người dùng

8.8.2. Tìm kiếm người dùng
Mục đích: Tìm nhanh tài khoản người dùng theo từ khóa để rút ngắn thời gian xử lý.
Các bước thực hiện:

1. Tại thanh bộ lọc bên trái, nhập từ khóa vào ô Tìm kiếm người dùng.
2. Chờ hệ thống tự động áp dụng bộ lọc.
3. Kiểm tra danh sách đã thu gọn theo điều kiện tìm kiếm.
4. Nhấn Clear all để xóa điều kiện và quay về toàn bộ dữ liệu.

Kết quả mong đợi: Danh sách chỉ hiển thị các người dùng phù hợp từ khóa đã nhập.

Ảnh 2: Bộ lọc tìm kiếm người dùng

8.8.3. Sắp xếp danh sách người dùng
Mục đích: Theo dõi dữ liệu theo các thứ tự phổ biến phục vụ quản trị.
Các bước thực hiện:

1. Tại thanh bộ lọc, mở mục Sắp xếp.
2. Chọn một trong các tiêu chí: Tên A-Z, Tên Z-A, Mới nhất, Cũ nhất.
3. Quan sát bảng dữ liệu sau khi áp dụng.
4. Nhấn Clear all khi cần bỏ điều kiện sắp xếp.

Kết quả mong đợi: Danh sách người dùng được hiển thị đúng thứ tự theo lựa chọn.

Ảnh 3: Chức năng sắp xếp người dùng

8.8.4. Thêm mới người dùng
Mục đích: Tạo tài khoản mới để phân bổ nhân sự vào hệ thống vận hành.
Các bước thực hiện:

1. Tại màn hình Danh sách người dùng, nhấn Thêm người dùng.
2. Nhập đầy đủ thông tin: Họ tên, Email, Tên đăng nhập, Mật khẩu.
3. Chọn Vai trò từ danh sách vai trò hệ thống.
4. Chọn Cấp bậc từ danh sách cấp bậc hệ thống.
5. Nhấn Lưu người dùng.

Kết quả mong đợi: Tài khoản mới được tạo thành công và hiển thị trong danh sách.

Ảnh 4: Hộp thoại thêm người dùng

8.8.5. Cập nhật người dùng
Mục đích: Chỉnh sửa thông tin tài khoản để phù hợp thay đổi tổ chức hoặc phân quyền.
Các bước thực hiện:

1. Chọn người dùng cần chỉnh sửa.
2. Nhấn biểu tượng Sửa tại cột Hành động.
3. Cập nhật thông tin cần thay đổi (họ tên, email, username, vai trò, cấp bậc, mật khẩu nếu cần đổi).
4. Nhấn Cập nhật người dùng.

Kết quả mong đợi: Hồ sơ người dùng được cập nhật thành công và dữ liệu bảng được đồng bộ lại.

Ảnh 5: Hộp thoại cập nhật người dùng

8.8.6. Xóa người dùng
Mục đích: Loại bỏ tài khoản không còn sử dụng hoặc tạo sai thông tin.
Các bước thực hiện:

1. Chọn người dùng cần xóa trong danh sách.
2. Mở menu Hành động tại dòng dữ liệu.
3. Nhấn Xóa.
4. Xác nhận tại hộp thoại Xóa người dùng.

Kết quả mong đợi: Tài khoản bị xóa khỏi hệ thống và danh sách được tải lại.

Ảnh 6: Hộp thoại xác nhận xóa người dùng

8.8.7. Chọn vai trò và cấp bậc khi tạo/sửa người dùng
Mục đích: Gắn đúng vai trò và cấp bậc để bảo đảm quyền thao tác phù hợp nghiệp vụ.
Nguyên tắc nghiệp vụ:

- Danh sách Vai trò được lấy từ API role.
- Danh sách Cấp bậc được lấy từ API level.
- Khi sửa người dùng, hệ thống tự ánh xạ role/level hiện tại vào form để tránh nhập lại thủ công.

Các bước thực hiện:

1. Mở form Thêm/Sửa người dùng.
2. Chọn Vai trò trong trường Vai trò.
3. Chọn Cấp bậc trong trường Cấp bậc.
4. Lưu biểu mẫu để cập nhật dữ liệu.

Kết quả mong đợi: Người dùng được gán đúng vai trò và cấp bậc theo cấu hình tổ chức.

Ảnh 7: Chọn vai trò và cấp bậc trong form người dùng

8.8.8. Quản lý mật khẩu khi cập nhật người dùng
Mục đích: Cho phép thay đổi mật khẩu có kiểm soát khi chỉnh sửa tài khoản.
Các bước thực hiện:

1. Mở form sửa người dùng.
2. Tại trường Mật khẩu, để trống nếu không thay đổi.
3. Nếu cần đổi mật khẩu, nhập mật khẩu mới theo điều kiện tối thiểu.
4. Nhấn Cập nhật người dùng để hoàn tất.

Kết quả mong đợi: Mật khẩu chỉ thay đổi khi người vận hành chủ động nhập giá trị mới.

Ảnh 8: Trường mật khẩu trong form cập nhật người dùng

8.8.9. Phân trang danh sách người dùng
Mục đích: Duyệt dữ liệu số lượng lớn theo từng trang để tối ưu tốc độ và trải nghiệm.
Các bước thực hiện:

1. Chọn số hàng trên mỗi trang (10/20/30/40/50).
2. Dùng các nút Trang trước, Trang sau để điều hướng.
3. Trên màn hình lớn, có thể dùng thêm Trang đầu và Trang cuối.

Kết quả mong đợi: Bảng hiển thị đúng số bản ghi mỗi trang và điều hướng chính xác theo trang đã chọn.

Ảnh 9: Thanh phân trang danh sách người dùng

8.8.10. Chọn nhiều dòng dữ liệu người dùng
Mục đích: Hỗ trợ kiểm soát danh sách bản ghi đang được chọn trong phiên thao tác.
Các bước thực hiện:

1. Tích checkbox tại từng dòng để chọn người dùng.
2. Tích checkbox ở tiêu đề bảng để chọn toàn bộ dòng trong trang hiện tại.
3. Theo dõi bộ đếm số người dùng đã chọn tại khu vực phân trang.

Kết quả mong đợi: Người vận hành biết chính xác số lượng bản ghi đang chọn để phục vụ các tác vụ mở rộng sau này.

Ảnh 10: Chọn nhiều người dùng trên bảng dữ liệu

8.9. Phân quyền sử dụng trong module người dùng
Mục đích: Đảm bảo chỉ tài khoản có quyền hợp lệ mới truy cập màn hình quản lý người dùng.
Nguyên tắc áp dụng:

- Route `/users` được bảo vệ bởi quyền `VIEW_USERS`.
- Các thao tác thêm/sửa/xóa được thực thi qua API và phụ thuộc thêm vào chính sách quyền phía backend.

Kết quả mong đợi: Truy cập và thao tác được giới hạn đúng vai trò, giảm rủi ro thao tác trái phép.
