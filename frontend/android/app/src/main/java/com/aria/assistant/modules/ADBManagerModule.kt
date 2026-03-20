package com.aria.assistant.modules

import android.content.Context
import android.net.wifi.WifiManager
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.InetAddress
import java.net.NetworkInterface

class ADBManagerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private val context = reactContext
    
    override fun getName(): String {
        return "ADBManager"
    }
    
    /**
     * Get device IP address on WiFi network
     */
    @ReactMethod
    fun getDeviceIP(promise: Promise) {
        try {
            val interfaces = NetworkInterface.getNetworkInterfaces()
            while (interfaces.hasMoreElements()) {
                val networkInterface = interfaces.nextElement()
                val addresses = networkInterface.inetAddresses
                
                while (addresses.hasMoreElements()) {
                    val address = addresses.nextElement()
                    if (!address.isLoopbackAddress && address is java.net.Inet4Address) {
                        val ip = address.hostAddress
                        if (ip != null && !ip.startsWith("127.")) {
                            promise.resolve(ip)
                            return
                        }
                    }
                }
            }
            promise.reject("NO_IP", "Unable to get device IP address")
        } catch (e: Exception) {
            promise.reject("ERROR", "Error getting IP: ${e.message}")
        }
    }
    
    /**
     * Check if ADB debugging is enabled
     */
    @ReactMethod
    fun isADBEnabled(promise: Promise) {
        try {
            val adbEnabled = Settings.Global.getInt(
                context.contentResolver,
                Settings.Global.ADB_ENABLED,
                0
            ) == 1
            promise.resolve(adbEnabled)
        } catch (e: Exception) {
            promise.reject("ERROR", "Error checking ADB status: ${e.message}")
        }
    }
    
    /**
     * Get ADB port (usually 5555)
     */
    @ReactMethod
    fun getADBPort(promise: Promise) {
        try {
            val port = Settings.Global.getInt(
                context.contentResolver,
                "adb_port",
                5555
            )
            promise.resolve(port)
        } catch (e: Exception) {
            promise.resolve(5555) // Default port
        }
    }
    
    /**
     * Start ADB wireless mode (requires root or system permissions)
     */
    @ReactMethod
    fun startADBWireless(promise: Promise) {
        try {
            // Try to execute setprop command (requires root)
            val process = Runtime.getRuntime().exec(arrayOf(
                "su", "-c",
                "setprop service.adb.tcp.port 5555 && stop adbd && start adbd"
            ))
            
            val exitCode = process.waitFor()
            if (exitCode == 0) {
                promise.resolve(true)
            } else {
                promise.reject("NO_ROOT", "Root access required for automatic ADB wireless activation")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", "Unable to start ADB wireless: ${e.message}")
        }
    }
    
    /**
     * Execute ADB command
     * Note: This requires the app to have ADB connection established
     */
    @ReactMethod
    fun executeCommand(command: String, promise: Promise) {
        try {
            val process = Runtime.getRuntime().exec(command)
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            val output = StringBuilder()
            var line: String?
            
            while (reader.readLine().also { line = it } != null) {
                output.append(line).append("\n")
            }
            
            val exitCode = process.waitFor()
            val result = Arguments.createMap()
            result.putInt("exitCode", exitCode)
            result.putString("output", output.toString())
            result.putBoolean("success", exitCode == 0)
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("EXEC_ERROR", "Command execution failed: ${e.message}")
        }
    }
    
    /**
     * Get pairing information for ADB wireless
     */
    @ReactMethod
    fun getADBPairingInfo(promise: Promise) {
        try {
            val ip = getLocalIpAddress()
            val port = 5555
            val pairingPort = 5556 // Default pairing port
            
            val info = Arguments.createMap()
            info.putString("ip", ip)
            info.putInt("port", port)
            info.putInt("pairingPort", pairingPort)
            info.putString("connectionString", "$ip:$port")
            info.putString("pairingString", "$ip:$pairingPort")
            
            promise.resolve(info)
        } catch (e: Exception) {
            promise.reject("ERROR", "Error getting pairing info: ${e.message}")
        }
    }
    
    /**
     * Get list of installed packages
     */
    @ReactMethod
    fun getInstalledPackages(promise: Promise) {
        try {
            val packageManager = context.packageManager
            val packages = packageManager.getInstalledApplications(0)
            val packageArray = Arguments.createArray()
            
            for (packageInfo in packages) {
                val pkg = Arguments.createMap()
                pkg.putString("packageName", packageInfo.packageName)
                pkg.putString("appName", packageInfo.loadLabel(packageManager).toString())
                packageArray.pushMap(pkg)
            }
            
            promise.resolve(packageArray)
        } catch (e: Exception) {
            promise.reject("ERROR", "Error getting packages: ${e.message}")
        }
    }
    
    /**
     * Launch application by package name
     */
    @ReactMethod
    fun launchApp(packageName: String, promise: Promise) {
        try {
            val intent = context.packageManager.getLaunchIntentForPackage(packageName)
            if (intent != null) {
                intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.reject("NOT_FOUND", "App not found: $packageName")
            }
        } catch (e: Exception) {
            promise.reject("ERROR", "Error launching app: ${e.message}")
        }
    }
    
    /**
     * Check if device is rooted
     */
    @ReactMethod
    fun isDeviceRooted(promise: Promise) {
        val rooted = checkRoot()
        promise.resolve(rooted)
    }
    
    // Helper methods
    private fun getLocalIpAddress(): String {
        try {
            val interfaces = NetworkInterface.getNetworkInterfaces()
            while (interfaces.hasMoreElements()) {
                val networkInterface = interfaces.nextElement()
                val addresses = networkInterface.inetAddresses
                
                while (addresses.hasMoreElements()) {
                    val address = addresses.nextElement()
                    if (!address.isLoopbackAddress && address is java.net.Inet4Address) {
                        return address.hostAddress ?: "Unknown"
                    }
                }
            }
        } catch (e: Exception) {
            // Ignore
        }
        return "Unknown"
    }
    
    private fun checkRoot(): Boolean {
        val paths = arrayOf(
            "/system/app/Superuser.apk",
            "/sbin/su",
            "/system/bin/su",
            "/system/xbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su",
            "/su/bin/su"
        )
        
        for (path in paths) {
            if (java.io.File(path).exists()) {
                return true
            }
        }
        
        return try {
            Runtime.getRuntime().exec("su")
            true
        } catch (e: Exception) {
            false
        }
    }
    
    /**
     * Send event to JavaScript
     */
    private fun sendEvent(eventName: String, params: WritableMap?) {
        context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}
