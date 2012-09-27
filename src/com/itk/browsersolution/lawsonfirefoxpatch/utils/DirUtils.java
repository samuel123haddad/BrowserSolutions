package com.itk.browsersolution.lawsonfirefoxpatch.utils;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Iterator;
import java.util.Map;
import java.util.TreeMap;

/**
 * @author iTK Technologies,LLC
 * @version 1.1
 */
public class DirUtils {
    private static final SimpleDateFormat df = new SimpleDateFormat("yyyyMMddhhmmss");
    
    private static void listNewer(TreeMap files, File pth) {
        File[] list = pth.listFiles();
        if (list != null) {
            for(int i=0; i < list.length; i++) {
                File file = list[i];
                if (file.getName().startsWith("."))
                    continue;
                if (file.isDirectory()) {
                    listNewer(files, file);
                } else {
                    files.put(df.format(new Date(file.lastModified())) + file.getName(), file);
                }
            }
        }
    }
    
    public static void listNewer(String path) {
        File pth = new File(path);
        TreeMap files = new TreeMap();
        listNewer(files, pth);
        Iterator i = files.entrySet().iterator();
        while (i.hasNext()) {
            Map.Entry entry = (Map.Entry)i.next();
            System.out.println(new Date(((File)entry.getValue()).lastModified()) + " - " + ((File)entry.getValue()).getAbsolutePath());
        }
    }
}
