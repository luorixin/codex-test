package com.quizapp.framework.security.service;

import com.quizapp.system.domain.dto.LoginBody;
import com.quizapp.system.domain.dto.RefreshTokenBody;
import com.quizapp.system.domain.vo.AuthSessionVo;

public interface IAuthService {
  AuthSessionVo login(LoginBody body);

  AuthSessionVo refresh(RefreshTokenBody body);

  void logout();
}
