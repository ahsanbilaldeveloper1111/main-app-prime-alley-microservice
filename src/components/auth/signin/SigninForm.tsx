import React from "react";
import { FaSpinner } from "react-icons/fa";

import type { SigninPageViewModel } from "./useSigninPage";

export function SigninForm(props: Readonly<{ vm: SigninPageViewModel }>): React.ReactElement {
  const { vm } = props;

  return (
    <div className="card my-5 mx-3">
      <div className="card-body">
        <h4 className="f-w-500 mb-1">Welcome Back</h4>
        <p className="mb-3">Sign in to your account</p>

        <form onSubmit={vm.handleSubmit}>
          <div className="form-group mb-3">
            <input
              ref={vm.emailInputRef}
              type="text"
              className="form-control"
              id="email"
              placeholder="Username"
              required
              name="email"
              value={vm.credentials.email}
              onChange={vm.handleChange}
              onInput={vm.handleInput}
              autoComplete="username"
              onFocus={vm.onEmailFocus}
              onBlur={vm.onEmailBlur}
              onKeyDown={vm.onEmailKeyDown}
            />
          </div>
          <div className="form-group mb-3 position-relative">
            <input
              ref={vm.passwordInputRef}
              type={vm.showPassword ? "text" : "password"}
              className="form-control"
              id="password"
              placeholder="Password"
              required
              name="password"
              value={vm.credentials.password}
              onChange={vm.handleChange}
              onInput={vm.handleInput}
              autoComplete="current-password"
              onFocus={vm.onPasswordFocus}
              onKeyDown={vm.onPasswordKeyDown}
            />
            <button
              type="button"
              className="position-absolute signinPage-passwordToggle btn p-0 border-0 bg-transparent text-secondary shadow-none"
              onClick={vm.toggleShowPassword}
              aria-label={vm.showPassword ? "Hide password" : "Show password"}
            >
              <i
                className={`fas ${vm.showPassword ? "fa-eye-slash" : "fa-eye"}`}
              />
            </button>
          </div>
          {vm.error && (
            <div className="alert alert-danger" role="alert">
              {vm.error}
            </div>
          )}
          <div className="d-grid mt-4">
            <button type="submit" className="btn btn-primary" disabled={vm.loading}>
              {vm.loading ? (
                <span className="d-flex align-items-center justify-content-center">
                  <FaSpinner className="fa-spin me-2" />
                  Signing in...
                </span>
              ) : (
                <span className="d-flex align-items-center justify-content-center">
                  <i className="fas fa-sign-in-alt me-2" /> Sign in
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
