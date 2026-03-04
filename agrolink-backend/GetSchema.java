import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.ResultSetMetaData;

public class GetSchema {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0";
        String user = "postgres.ufmhxrfopuaqmzbeqfxe";
        String password = "Shashin1234#";
        
        try {
            Connection con = DriverManager.getConnection(url, user, password);
            Statement stmt = con.createStatement();
            
            ResultSet rs = stmt.executeQuery("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';");
            while (rs.next()) {
                String tableName = rs.getString("table_name");
                System.out.println("\n--- TABLE: " + tableName + " ---");
                
                try {
                	Statement stmtCols = con.createStatement();
                	ResultSet cols = stmtCols.executeQuery("SELECT * FROM " + tableName + " LIMIT 0;");
                	ResultSetMetaData rsmd = cols.getMetaData();
                    for (int i = 1; i <= rsmd.getColumnCount(); i++) {
                        System.out.println("  - " + rsmd.getColumnName(i) + " (" + rsmd.getColumnTypeName(i) + ")");
                    }
                } catch(Exception e){}
            }
            con.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
