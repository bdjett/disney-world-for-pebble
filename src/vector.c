#include "common.h"

// Initialize vector for 10 items
void vector_init(vector *v)
{
  v->data = (void **)malloc(10 * sizeof(void *));
  v->size = 10;
  v->count = 0;
}

// Number of items in vector
int vector_count(vector *v)
{
  return v->count;
}

// Append item to end of vector, allocating more space by doubling the size if needed
void vector_add(vector *v, void *e)
{
  // last slot exhausted
  if (v->size == v->count) {
    // v->size *= 2;
    // v->data = realloc(v->data, sizeof(void*) * v->size);
 
    int newsize = v->size * 2;
    void **newdata = (void **)malloc(sizeof(void *) * newsize);
    memcpy(newdata, v->data, sizeof(void *) * v->size);
 
    free(v->data);
    v->data = newdata;
    v->size = newsize;
  }
  
  v->data[v->count] = e;
  v->count++;
}

// Free memory from all objects in vector, then free the vector itself
void vector_free(vector *v)
{ 
  for (int i = 0; i < v->count; i++) {
    free(v->data[i]);
  }
  free(v->data);
  v->data = NULL;
  v->count = 0;
  v->size = 0;
}