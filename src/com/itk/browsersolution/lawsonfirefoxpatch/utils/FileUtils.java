package com.itk.browsersolution.lawsonfirefoxpatch.utils;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 *
 * @author iTK Technologies,LLC
 * @version 1.1
 */
public class FileUtils {
    public static final int BUFFER_SIZE = 4096;

    public static StringBuffer loadText(File file) {
        long length = file.length();
        if (length <= 0)
            return new StringBuffer();
        byte[] buffer = new byte[(int)length];
        String text=null;
        try {
            FileInputStream in = new FileInputStream(file);
            try {
                in.read(buffer);
                text = new String(buffer, "utf8");
            } finally {
                in.close();
            }
        } catch (IOException ex) {
            Logger.getLogger(FileUtils.class.getName()).log(Level.SEVERE, null, ex);
            return new StringBuffer();
        }
        StringBuffer bf = new StringBuffer(text);
        return bf;
    }
    
    public static boolean saveText(File file, StringBuffer bf) {
        try {
            FileOutputStream out = new FileOutputStream(file);
            try {
                out.write(bf.toString().getBytes("utf8"));
                return true;
            } finally {
                out.flush();
                out.close();
            }
        } catch(IOException ex) {
            Logger.getLogger(FileUtils.class.getName()).log(Level.SEVERE, null, ex);
        }
        return false;
    }
    
    public static boolean copyFile(File src, File dst) {
        try {
            File path = dst.getParentFile();
            if (! path.exists())
                path.mkdirs();
            FileInputStream in = new FileInputStream(src);
            FileOutputStream out = new FileOutputStream(dst);
            in.getChannel().transferTo(0, src.length(), out.getChannel());
            out.flush();
            out.close();
            dst.setLastModified(src.lastModified());
            return true;
        } catch(IOException ex) {
            Logger.getLogger(FileUtils.class.getName()).log(Level.SEVERE, null, ex);
            return false;
        }
    }

    public static boolean transfer(InputStream in, OutputStream out, byte buffer[]) throws IOException {
        if (in == null || out == null || buffer == null || buffer.length == 0) {
            return false;
        }
        int size, total = 0;
        while ((size = in.read(buffer)) >= 0) {
            total += size;
            out.write(buffer, 0, size);
        }
        return total > 0;
    }

    public static boolean transfer(InputStream in, OutputStream out) throws IOException {
        if (in == null || out == null) {
            return false;
        }
        byte buffer[] = new byte[BUFFER_SIZE];
        return transfer(in, out, buffer);
    }

    public static void copyInexistantResource(String source, File dest) {
        try {
            File target = new File(dest, source);
            if (!target.exists() || target.length() == 0)
            {
                copyResource(source, dest);
            }
        } catch(Exception ex) {
            System.out.println("I can't copy resource "+source+" to "+dest.getAbsolutePath());
            ex.printStackTrace();
        }
    }
    
    public static void copyResource(String source, File dest) {
        try {
            FileOutputStream fout = new FileOutputStream(new File(dest, source));
            try {
                System.out.println("updating ... "+source);
                transfer(FileUtils.class.getResourceAsStream("/resources/"+source), fout);
            } finally {
                fout.flush();
                fout.close();
            }
        } catch(Exception ex) {
            System.out.println("I can't copy resource "+source+" to "+dest.getAbsolutePath());
            ex.printStackTrace();
        }
    }
}
