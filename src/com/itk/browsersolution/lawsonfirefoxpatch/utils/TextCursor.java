package com.itk.browsersolution.lawsonfirefoxpatch.utils;

/**
 * Class for handling text file content.
 * 
 * @author Samuel Haddad
 * @version 2.4
 */
public class TextCursor {
    public static final String SPACE=":SPACE:";
    
    StringBuffer bf;
    int ps;
    
    public TextCursor(StringBuffer bf) {
        this(bf, 0);
    }
    public TextCursor(StringBuffer bf, int ps) {
        this.bf = bf;
        this.ps = ps;
    }

    public void release() {
        bf = null;
        ps = -1;
    }
    
    public int getPos() {
        return ps;
    }
    
    public void setPos(int ps) {
        this.ps = ps;
    }
    
    public boolean isStartOfText() {
        return bf == null || ps == 0;
    }
    
    public boolean isEndOfText() {
        return bf == null || ps >= bf.length();
    }
    
    public boolean isEndOfLine() {
        return isEndOfText() || bf.charAt(ps) == '\r' || bf.charAt(ps) == '\n';
    }
    
    public boolean isStartOfLine() {
        return ps == 0 || bf.charAt(ps-1) == '\r' || bf.charAt(ps-1) == '\n';
    }
    
    public void goStartLine() {
        while (! isStartOfLine()) {
            ps--;
        }
    }
    
    public boolean goEndLine() {
        while (! isEndOfLine()) {
            ps++;
        }
        return ! isEndOfText();
    }
    
    public boolean goEndText() {
        if (bf == null)
            return false;
        ps = bf.length();
        return true;
    }
    
    public boolean goPreviousLine() {
        goStartLine();
        if (ps < 1)
            return false;
        if (--ps > 0) {
            if (bf.charAt(--ps) == '\r')
                ps--;
            goStartLine();
        }
        return true;
    }
    
    public boolean goNextLine() {
        if (isEndOfText())
            return false;
        goEndLine();
        if (! isEndOfText()) {
            if (bf.charAt(ps++) == '\r') {
                if (! isEndOfText() && bf.charAt(ps) == '\n')
                    ps++;
            }
            return true;
        }
        return false;
    }

    public boolean goNextColumn() {
        if (isEndOfLine())
            return false;
        ps++;
        return true;
    }
    
    public boolean goPreviousColumn() {
        if (isStartOfLine())
            return false;
        ps--;
        return true;
    }
    
    public void goStartText() {
        ps = 0;
    }
    
    public boolean find(String text) {
        ps = 0;
        return findNext(text);
    }
    
    public boolean findLast(String text) {
        ps = bf.length();
        return findPrior(text);
    }
    public boolean findNext(String text) {
        return nextIndexOf(text) >= 0;
    }
    public boolean findPrior(String text) {
        return previousIndexOf(text) >= 0;
    }    
    public int nextIndexOf(String what) {
        ps = bf.indexOf(what, ps);
        return ps;
    }

    public int firstIndexOf(String what) {
        return bf.indexOf(what);
    }
    
    public int lastIndexOf(String what) {
        return bf.lastIndexOf(what);
    }
    
    
    public int previousIndexOf(String what) {
        ps = bf.lastIndexOf(what, ps);
        return ps;
    }
    
    public void delete(int size) {
        bf.delete(ps, ps+size);
    }
    
    public void replace(int size, String to) {
        bf.replace(ps, ps+size, to);
        ps += to.length();
    }
    
    public void insert(String text) {
        bf.insert(ps, text);
        ps += text.length();
    }

    public void insertLine(String text) {
        if (text != null)
        {
            text = "\n".concat(text);
            bf.insert(ps, text);
        }else
        {
            bf.insert(ps, "\n");
        }

        ps += text.length();
    }
    
    public boolean goLine(int line) {
        ps = 0;
        while (--line > 0) {
            if (! goNextLine())
                return false;
        }
        return true;
    }
    
    public boolean isText(String text) {
        return bf.substring(ps, ps+text.length()).equals(text);
    }
    
    public int countLines() {
        int ups = ps;
        try {
            ps = 0;
            int count = 0;
            while (goNextLine())
                count++;
            return count;
        } finally {
            ps = ups;
        }
    }
    
    public TextCursor ignoreSpace() {
        while (! isEndOfLine() && Character.isWhitespace(bf.charAt(ps))) {
            ps++;
        }
        return this;
    }
    
    public String substring(int start, int end) {
        return bf.substring(start, end);
    }
    
    public boolean deleteLine(String line)
    {
        boolean result = findNext(line);
        if (!result) {
            return result;
        }
        return deleteLine();
    }
    
    public boolean deleteLine()
    {
        goStartLine();
        int size = getLine().length();
        if (size == 0) return false;
        delete(size);
        goNextLine();
        return true;
    }
    
    public String getLine() {
        int ops = ps;
        goStartLine();
        int psi = ps;
        goEndLine();
        if (ps != psi) {
            String line = substring(psi, ps);
            ps = ops;
            return line;
        }
        return "";
    }
}
