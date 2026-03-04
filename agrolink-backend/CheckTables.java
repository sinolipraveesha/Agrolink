import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckTables {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0";
        String user = "postgres.ufmhxrfopuaqmzbeqfxe";
        String password = "Shashin1234#";
        
        try (Connection con = DriverManager.getConnection(url, user, password);
             Statement stmt = con.createStatement()) {
            
            System.out.println("--- farmer_shop_products ---");
            ResultSet rs1 = stmt.executeQuery("SELECT count(*) FROM public.farmer_shop_products;");
            if (rs1.next()) System.out.println("Count: " + rs1.getInt(1));
            
            System.out.println("--- products ---");
            ResultSet rs2 = stmt.executeQuery("SELECT count(*) FROM public.products;");
            if (rs2.next()) System.out.println("Count: " + rs2.getInt(1));
            
            System.out.println("--- recent products ---");
            ResultSet rs3 = stmt.executeQuery("SELECT name, created_at FROM public.products ORDER BY created_at DESC LIMIT 5;");
            while(rs3.next()) {
                System.out.println(rs3.getString("name") + " - " + rs3.getString("created_at"));
            }
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
