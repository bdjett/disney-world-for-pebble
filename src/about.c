#include "common.h"

static Window *s_window;
static GFont s_res_gothic_14;
static TextLayer *description_text_layer;
static ScrollLayer *scroll_layer;

// Initialize all UI components
static void initialise_ui(void) {
  s_window = window_create();
  GRect bounds = layer_get_bounds(window_get_root_layer(s_window));

  // fonts
  s_res_gothic_14 = fonts_get_system_font(FONT_KEY_GOTHIC_14);

  // scroll layer
  scroll_layer = scroll_layer_create(bounds);
  scroll_layer_set_click_config_onto_window(scroll_layer, s_window);
  layer_add_child(window_get_root_layer(s_window), scroll_layer_get_layer(scroll_layer));

  // description_text_layer
  description_text_layer = text_layer_create(GRect(5, 5, 134, 2000));
  text_layer_set_font(description_text_layer, s_res_gothic_14);
  text_layer_set_overflow_mode(description_text_layer, GTextOverflowModeTrailingEllipsis);
  scroll_layer_add_child(scroll_layer, text_layer_get_layer(description_text_layer));

  text_layer_set_text(description_text_layer, "My Disney Experience for Pebble\n\nDeveloped by: Brian Jett (logicalpixels.com)\n\nVersion: 2.1\n\nMy Disney Experience for Pebble is not associated with nor endorsed by Walt Disney World or its parent companies in any way.\n\nSend bug reports to bdjett@me.com");
  GSize size = text_layer_get_content_size(description_text_layer);
  text_layer_set_size(description_text_layer, size);

  scroll_layer_set_content_size(scroll_layer, GSize(144, size.h + 10));
}

// Free all memory used by UI components
static void destroy_ui(void) {
  window_destroy(s_window);
  scroll_layer_destroy(scroll_layer);
  text_layer_destroy(description_text_layer);
}

// Window unload callback
static void handle_window_unload(Window* window) {
  destroy_ui();
}

// Push window on to stack
void show_about(void) {
  initialise_ui();
  window_set_window_handlers(s_window, (WindowHandlers) {
    .unload = handle_window_unload,
  });
  window_stack_push(s_window, true);
}

// Remove window from stack
void hide_about(void) {
  window_stack_remove(s_window, true);
}
