#include "error_window.h"
#include <pebble.h>

// BEGIN AUTO-GENERATED UI CODE; DO NOT MODIFY
static Window *s_window;
static GBitmap *s_res_image_mickey_icon;
static GFont s_res_gothic_18_bold;
static GFont s_res_gothic_18;
static BitmapLayer *error_icon_bitmap_layer;
static TextLayer *error_title_text_layer;
static TextLayer *error_description_text_layer;
static InverterLayer *error_icon_inverter_layer;

static void initialise_ui(void) {
  s_window = window_create();
  window_set_background_color(s_window, GColorBlack);
  window_set_fullscreen(s_window, false);
  
  s_res_image_mickey_icon = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_MICKEY_ICON);
  s_res_gothic_18_bold = fonts_get_system_font(FONT_KEY_GOTHIC_18_BOLD);
  s_res_gothic_18 = fonts_get_system_font(FONT_KEY_GOTHIC_18);
  // error_icon_bitmap_layer
  error_icon_bitmap_layer = bitmap_layer_create(GRect(60, 10, 24, 24));
  bitmap_layer_set_bitmap(error_icon_bitmap_layer, s_res_image_mickey_icon);
  layer_add_child(window_get_root_layer(s_window), (Layer *)error_icon_bitmap_layer);
  
  // error_title_text_layer
  error_title_text_layer = text_layer_create(GRect(5, 41, 134, 20));
  text_layer_set_background_color(error_title_text_layer, GColorClear);
  text_layer_set_text_color(error_title_text_layer, GColorWhite);
  text_layer_set_text(error_title_text_layer, "Login Required");
  text_layer_set_text_alignment(error_title_text_layer, GTextAlignmentCenter);
  text_layer_set_font(error_title_text_layer, s_res_gothic_18_bold);
  layer_add_child(window_get_root_layer(s_window), (Layer *)error_title_text_layer);
  
  // error_description_text_layer
  error_description_text_layer = text_layer_create(GRect(5, 65, 134, 81));
  text_layer_set_background_color(error_description_text_layer, GColorClear);
  text_layer_set_text_color(error_description_text_layer, GColorWhite);
  text_layer_set_text(error_description_text_layer, "Please open the Pebble app and login to My Disney Experience.");
  text_layer_set_text_alignment(error_description_text_layer, GTextAlignmentCenter);
  text_layer_set_font(error_description_text_layer, s_res_gothic_18);
  layer_add_child(window_get_root_layer(s_window), (Layer *)error_description_text_layer);
  
  // error_icon_inverter_layer
  error_icon_inverter_layer = inverter_layer_create(GRect(60, 10, 24, 24));
  layer_add_child(window_get_root_layer(s_window), (Layer *)error_icon_inverter_layer);
}

static void destroy_ui(void) {
  window_destroy(s_window);
  bitmap_layer_destroy(error_icon_bitmap_layer);
  text_layer_destroy(error_title_text_layer);
  text_layer_destroy(error_description_text_layer);
  inverter_layer_destroy(error_icon_inverter_layer);
  gbitmap_destroy(s_res_image_mickey_icon);
}
// END AUTO-GENERATED UI CODE

static void handle_window_unload(Window* window) {
  destroy_ui();
}

void show_error_window(void) {
  initialise_ui();
  window_set_window_handlers(s_window, (WindowHandlers) {
    .unload = handle_window_unload,
  });
  window_stack_push(s_window, true);
}

void hide_error_window(void) {
  window_stack_remove(s_window, true);
}
