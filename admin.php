<?php
// 加载环境配置
require __DIR__.'/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// 验证环境变量
if (!isset($_ENV['ADMIN_ENTRY_PATH']) || $_SERVER['REQUEST_URI'] !== '/'.$_ENV['ADMIN_ENTRY_PATH']) {
    header('HTTP/1.0 404 Not Found');
    exit;
}

// 会话管理
session_start();

// 认证检查
function is_authenticated() {
    return isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true;
}

// 登录处理
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';

    if ($username === $_ENV['ADMIN_USERNAME'] && 
        password_verify($password, $_ENV['ADMIN_PASSWORD_HASH'])) {
        $_SESSION['authenticated'] = true;
        header('Location: /'.$_ENV['ADMIN_ENTRY_PATH']);
        exit;
    }
    $error = 'Invalid credentials';
}

// 登出处理
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: /'.$_ENV['ADMIN_ENTRY_PATH']);
    exit;
}

// 未认证显示登录页
if (!is_authenticated()) {
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>Admin Login</title>
        <style>
            body { font-family: Arial; background: #f5f5f5; }
            .login-form { width: 300px; margin: 100px auto; padding: 20px; background: white; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .error { color: red; margin-bottom: 15px; }
        </style>
    </head>
    <body>
        <div class="login-form">
            <?php if (isset($error)) echo "<div class='error'>$error</div>"; ?>
            <form method="POST">
                <h2>Admin Login</h2>
                <div><input type="text" name="username" placeholder="Username" required></div>
                <div><input type="password" name="password" placeholder="Password" required></div>
                <button type="submit">Login</button>
            </form>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// 已认证显示管理界面
?>
<!DOCTYPE html>
<html>
<head>
    <title>Admin Panel</title>
    <style>
        body { font-family: Arial; margin: 0; }
        header { background: #333; color: white; padding: 10px 20px; display: flex; justify-content: space-between; }
        .container { padding: 20px; }
        .ad-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .ad-item { border: 1px solid #ddd; padding: 15px; }
    </style>
</head>
<body>
    <header>
        <h2>58奇迹广告管理系统</h2>
        <a href="?logout=1" style="color: white;">Logout</a>
    </header>
    <div class="container">
        <h3>广告管理</h3>
        <div class="ad-list">
            <!-- 广告管理内容将通过AJAX加载 -->
        </div>
    </div>
    <script>
    // 这里添加广告管理逻辑
    </script>
</body>
</html>