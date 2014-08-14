#include "common.h"

static Window *s_window;
static TextLayer *text_layer;
static BitmapLayer *loading_icon_layer;

// Initialize all UI components
static void initialise_ui(void) {
  s_window = window_create();
  window_set_fullscreen(s_window, 0);
  
  Layer *window_layer = window_get_root_layer(s_window);

  GRect bounds = layer_get_frame(window_layer);

  loading_icon_layer = bitmap_layer_create(GRect(0, 0, bounds.size.w, bounds.size.h));
  bitmap_layer_set_background_color(loading_icon_layer, GColorBlack);
  layer_add_child(window_layer, bitmap_layer_get_layer(loading_icon_layer));

  text_layer = text_layer_create(GRect(0, 60, bounds.size.w, 30));
  text_layer_set_text_alignment(text_layer, GTextAlignmentCenter);
  text_layer_set_overflow_mode(text_layer, GTextOverflowModeWordWrap);
  text_layer_set_font(text_layer, fonts_get_system_font(FONT_KEY_GOTHIC_24_BOLD));
  text_layer_set_background_color(text_layer, GColorBlack);
  text_layer_set_text_color(text_layer, GColorWhite);
  layer_add_child(window_layer, text_layer_get_layer(text_layer));
}

// Free all memory from UI components
static void destroy_ui(void) {
  window_destroy(s_window);
  text_layer_destroy(text_layer);
  bitmap_layer_destroy(loading_icon_layer);
}

// Window unload callback
static void handle_window_unload(Window* window) {
  destroy_ui();
}

// Show window
void show_error(char *error) {
  window_stack_pop(false);
  initialise_ui();
  text_layer_set_text(text_layer, error);
  window_set_window_handlers(s_window, (WindowHandlers) {
    .unload = handle_window_unload,
  });
  window_stack_push(s_window, true);
}

// Hide window
void hide_error(void) {
  window_stack_remove(s_window, true);
}