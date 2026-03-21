import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckDatabase {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0";
        String user = "postgres.ufmhxrfopuaqmzbeqfxe";
        String password = "Shashin1234#";
        
        try (Connection con = DriverManager.getConnection(url, user, password);
             Statement stmt = con.createStatement()) {
            
            ResultSet rs = stmt.executeQuery("SELECT current_database(), current_user, current_schema()");
            if(rs.next()) {
                System.out.println("DB: " + rs.getString(1) + ", User: " + rs.getString(2) + ", Schema: " + rs.getString(3));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
