✅ **Fallback Popup – Fields Are Sufficient for Now**

The fallback popup for a new, unrecognized guarantee includes:
- `Taux (décimal)`
- `Prime fixe (DT)`
- `Taux de réduction (%)`
- `Formule personnalisée (optionnel)`

This matches the default field configuration in the code.  

### **Are min/max value fields needed?**  
According to client notes, min/max value ranges are required only for guarantees that use vehicle values (VV/VN).  
- For **VOL, INCENDIE, TOUS_RISQUES_ZERO, BG** – min/max are present because those guarantees have explicit field lists.  
- For a **completely new, random guarantee**, it's impossible to know whether it needs value ranges. The fallback does not include them, which means if an admin later creates a new guarantee that should have value‑based rules, they would not see those fields.  

However, the client has not requested support for arbitrary new guarantees beyond the existing set. The current fallback is acceptable for now. If future requirements demand value ranges for new guarantees, the code can be easily extended by adding the guarantee code to the field configuration.

**Verdict:** No missing fields for the current scope. ✅