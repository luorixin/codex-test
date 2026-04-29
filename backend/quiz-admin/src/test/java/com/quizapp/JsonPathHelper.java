package com.quizapp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

final class JsonPathHelper {

  private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

  private JsonPathHelper() {}

  static String read(String json, String path) throws Exception {
    JsonNode node = OBJECT_MAPPER.readTree(json);
    String[] segments = path.replaceFirst("^\\$\\.", "").split("\\.");
    JsonNode current = node;
    for (String segment : segments) {
      current = current.get(segment);
    }
    return current.asText();
  }
}
