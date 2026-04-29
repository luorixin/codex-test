package com.quizapp.system.service;

import com.quizapp.system.domain.SysUser;

public interface ISysUserService {
  SysUser selectUserByUsername(String username);

  SysUser selectUserByEmail(String email);
}
