package com.aria.assistant.modules

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Intent
import android.graphics.Path
import android.graphics.PixelFormat
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class ARIAAccessibilityService : AccessibilityService() {
    
    companion object {
        private const val TAG = "ARIAAccessibility"
        private var instance: ARIAAccessibilityService? = null
        
        fun getInstance(): ARIAAccessibilityService? = instance
        
        fun isEnabled(): Boolean = instance != null
    }
    
    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.d(TAG, "ARIA Accessibility Service Connected")
    }
    
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Log UI events for learning
        event?.let {
            Log.d(TAG, "UI Event: ${it.eventType} - ${it.className}")
        }
    }
    
    override fun onInterrupt() {
        Log.d(TAG, "Service Interrupted")
    }
    
    override fun onUnbind(intent: Intent?): Boolean {
        instance = null
        return super.onUnbind(intent)
    }
    
    /**
     * Perform tap at specific coordinates
     */
    fun performTap(x: Int, y: Int, callback: (Boolean) -> Unit) {
        try {
            val path = Path()
            path.moveTo(x.toFloat(), y.toFloat())
            
            val gestureBuilder = GestureDescription.Builder()
            gestureBuilder.addStroke(
                GestureDescription.StrokeDescription(path, 0, 100)
            )
            
            val result = dispatchGesture(
                gestureBuilder.build(),
                object : GestureResultCallback() {
                    override fun onCompleted(gestureDescription: GestureDescription?) {
                        Log.d(TAG, "Tap completed at ($x, $y)")
                        callback(true)
                    }
                    
                    override fun onCancelled(gestureDescription: GestureDescription?) {
                        Log.e(TAG, "Tap cancelled at ($x, $y)")
                        callback(false)
                    }
                },
                null
            )
            
            if (!result) {
                callback(false)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Tap error: ${e.message}")
            callback(false)
        }
    }
    
    /**
     * Perform swipe gesture
     */
    fun performSwipe(x1: Int, y1: Int, x2: Int, y2: Int, duration: Long, callback: (Boolean) -> Unit) {
        try {
            val path = Path()
            path.moveTo(x1.toFloat(), y1.toFloat())
            path.lineTo(x2.toFloat(), y2.toFloat())
            
            val gestureBuilder = GestureDescription.Builder()
            gestureBuilder.addStroke(
                GestureDescription.StrokeDescription(path, 0, duration)
            )
            
            val result = dispatchGesture(
                gestureBuilder.build(),
                object : GestureResultCallback() {
                    override fun onCompleted(gestureDescription: GestureDescription?) {
                        Log.d(TAG, "Swipe completed from ($x1, $y1) to ($x2, $y2)")
                        callback(true)
                    }
                    
                    override fun onCancelled(gestureDescription: GestureDescription?) {
                        Log.e(TAG, "Swipe cancelled")
                        callback(false)
                    }
                },
                null
            )
            
            if (!result) {
                callback(false)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Swipe error: ${e.message}")
            callback(false)
        }
    }
    
    /**
     * Perform back button
     */
    fun performBack(): Boolean {
        return performGlobalAction(GLOBAL_ACTION_BACK)
    }
    
    /**
     * Perform home button
     */
    fun performHome(): Boolean {
        return performGlobalAction(GLOBAL_ACTION_HOME)
    }
    
    /**
     * Perform recent apps
     */
    fun performRecents(): Boolean {
        return performGlobalAction(GLOBAL_ACTION_RECENTS)
    }
    
    /**
     * Perform scroll down
     */
    fun performScrollDown(): Boolean {
        return performSwipeGesture(500, 1500, 500, 500, 300)
    }
    
    /**
     * Perform scroll up
     */
    fun performScrollUp(): Boolean {
        return performSwipeGesture(500, 500, 500, 1500, 300)
    }
    
    private fun performSwipeGesture(x1: Int, y1: Int, x2: Int, y2: Int, duration: Long): Boolean {
        var success = false
        performSwipe(x1, y1, x2, y2, duration) { result ->
            success = result
        }
        return success
    }
}

/**
 * React Native Module for Accessibility Service
 */
class AccessibilityModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private val context = reactContext
    
    override fun getName(): String {
        return "AccessibilityModule"
    }
    
    @ReactMethod
    fun isEnabled(promise: Promise) {
        promise.resolve(ARIAAccessibilityService.isEnabled())
    }
    
    @ReactMethod
    fun performTap(x: Int, y: Int, promise: Promise) {
        val service = ARIAAccessibilityService.getInstance()
        if (service == null) {
            promise.reject("NOT_ENABLED", "Accessibility service not enabled")
            return
        }
        
        service.performTap(x, y) { success ->
            if (success) {
                promise.resolve(true)
            } else {
                promise.reject("TAP_FAILED", "Failed to perform tap")
            }
        }
    }
    
    @ReactMethod
    fun performSwipe(x1: Int, y1: Int, x2: Int, y2: Int, duration: Int, promise: Promise) {
        val service = ARIAAccessibilityService.getInstance()
        if (service == null) {
            promise.reject("NOT_ENABLED", "Accessibility service not enabled")
            return
        }
        
        service.performSwipe(x1, y1, x2, y2, duration.toLong()) { success ->
            if (success) {
                promise.resolve(true)
            } else {
                promise.reject("SWIPE_FAILED", "Failed to perform swipe")
            }
        }
    }
    
    @ReactMethod
    fun performBack(promise: Promise) {
        val service = ARIAAccessibilityService.getInstance()
        if (service == null) {
            promise.reject("NOT_ENABLED", "Accessibility service not enabled")
            return
        }
        
        val result = service.performBack()
        promise.resolve(result)
    }
    
    @ReactMethod
    fun performHome(promise: Promise) {
        val service = ARIAAccessibilityService.getInstance()
        if (service == null) {
            promise.reject("NOT_ENABLED", "Accessibility service not enabled")
            return
        }
        
        val result = service.performHome()
        promise.resolve(result)
    }
    
    @ReactMethod
    fun performRecents(promise: Promise) {
        val service = ARIAAccessibilityService.getInstance()
        if (service == null) {
            promise.reject("NOT_ENABLED", "Accessibility service not enabled")
            return
        }
        
        val result = service.performRecents()
        promise.resolve(result)
    }
    
    @ReactMethod
    fun scrollDown(promise: Promise) {
        val service = ARIAAccessibilityService.getInstance()
        if (service == null) {
            promise.reject("NOT_ENABLED", "Accessibility service not enabled")
            return
        }
        
        val result = service.performScrollDown()
        promise.resolve(result)
    }
    
    @ReactMethod
    fun scrollUp(promise: Promise) {
        val service = ARIAAccessibilityService.getInstance()
        if (service == null) {
            promise.reject("NOT_ENABLED", "Accessibility service not enabled")
            return
        }
        
        val result = service.performScrollUp()
        promise.resolve(result)
    }
    
    @ReactMethod
    fun openSettings(promise: Promise) {
        try {
            val intent = android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS
            val settingsIntent = android.content.Intent(intent)
            settingsIntent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(settingsIntent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to open settings: ${e.message}")
        }
    }
}
