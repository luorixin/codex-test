package com.quizapp.framework.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan("com.quizapp.system.mapper")
public class MyBatisConfig {
}
