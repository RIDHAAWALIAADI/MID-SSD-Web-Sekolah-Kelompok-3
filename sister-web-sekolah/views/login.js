const { renderLayout } = require('./layout');

function loginPage(flash) {
  const flashHtml = (flash || [])
    .map(
      (f) => `
      <div class="alert alert-${f.type === 'error' ? 'danger' : 'success'} shadow-sm">
        ${f.message}
      </div>`
    )
    .join('');

  const body = `
  <style>
    body{
      background: linear-gradient(135deg,#2563eb,#4f46e5,#7c3aed);
      min-height:100vh;
    }

    .login-card{
      border:none;
      border-radius:20px;
      backdrop-filter: blur(10px);
      background:rgba(255,255,255,.95);
      box-shadow:0 20px 50px rgba(0,0,0,.25);
      animation:fadeIn .8s;
    }

    @keyframes fadeIn{
      from{
        opacity:0;
        transform:translateY(20px);
      }
      to{
        opacity:1;
        transform:translateY(0);
      }
    }

    .logo-circle{
      width:90px;
      height:90px;
      border-radius:50%;
      margin:auto;
      display:flex;
      align-items:center;
      justify-content:center;
      background:linear-gradient(135deg,#2563eb,#7c3aed);
      color:white;
      font-size:38px;
      margin-bottom:20px;
      box-shadow:0 10px 25px rgba(37,99,235,.4);
    }

    .form-control{
      border-radius:12px;
      padding:12px;
      border:1px solid #d1d5db;
    }

    .form-control:focus{
      border-color:#4f46e5;
      box-shadow:0 0 0 .2rem rgba(79,70,229,.25);
    }

    .btn-login{
      background:linear-gradient(135deg,#2563eb,#7c3aed);
      border:none;
      border-radius:12px;
      padding:12px;
      font-weight:bold;
      transition:.3s;
    }

    .btn-login:hover{
      transform:translateY(-2px);
      box-shadow:0 10px 20px rgba(37,99,235,.35);
    }

    .demo-box{
      background:#f8fafc;
      border-radius:12px;
      padding:15px;
      margin-top:20px;
    }

    .demo-box ul{
      margin:0;
      padding-left:18px;
    }

    h2{
      color:#2563eb;
      font-weight:700;
    }

    .subtitle{
      color:#6b7280;
    }
  </style>

  <div class="container">
    <div class="row justify-content-center align-items-center" style="min-height:100vh;">

      <div class="col-md-5">

        <div class="card login-card">

          <div class="card-body p-5">

            <div class="logo-circle">
              🎓
            </div>

            <h2 class="text-center">
              SISTER
            </h2>

            <p class="text-center subtitle mb-4">
              Sistem Informasi Sekolah Terintegrasi
            </p>

            ${flashHtml}

            <form method="POST" action="/login">

              <div class="mb-3">
                <label class="form-label fw-semibold">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  class="form-control"
                  placeholder="Masukkan Email"
                  required
                  autofocus>
              </div>

              <div class="mb-4">
                <label class="form-label fw-semibold">
                  Password
                </label>

                <input
                  type="password"
                  name="password"
                  class="form-control"
                  placeholder="Masukkan Password"
                  required>
              </div>

              <button class="btn btn-login text-white w-100" type="submit">
                Login
              </button>

            </form>

            <div class="demo-box">

              <strong>Akun Demo</strong>

              <p class="small text-muted mb-2">
                Password:
                <code>password123</code>
              </p>

              <ul class="small">
                <li>👨‍💼 admin@sekolah.test</li>
                <li>👨‍🏫 guru@sekolah.test</li>
                <li>🧑‍💼 bk@sekolah.test</li>
                <li>📚 walikelas@sekolah.test</li>
                <li>🏫 kepsek@sekolah.test</li>
                <li>🎓 siswa@sekolah.test</li>
                <li>👪 ortu@sekolah.test</li>
              </ul>

            </div>

          </div>

        </div>

      </div>

    </div>

  </div>
  `;

  return renderLayout({
    title: 'Login',
    user: null,
    body
  });
}

module.exports = { loginPage };