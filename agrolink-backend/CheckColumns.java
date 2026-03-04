import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckColumns {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0";
        String user = "postgres.ufmhxrfopuaqmzbeqfxe";
        String password = "Shashin1234#";
        
        try (Connection con = DriverManager.getConnection(url, user, password);
             Statement stmt = con.createStatement()) {
            
            System.out.println("--- Columns in farmer_shop_products ---");
            ResultSet rs = stmt.executeQuery("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'farmer_shop_products'");
            while(rs.next()) {
                System.out.println(rs.getString("column_name") + " - " + rs.getString("data_type"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
