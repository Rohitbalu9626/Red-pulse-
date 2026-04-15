COMPATIBILITY = {
    "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
    "O+": ["O+", "A+", "B+", "AB+"],
    "A-": ["A-", "A+", "AB-", "AB+"],
    "A+": ["A+", "AB+"],
    "B-": ["B-", "B+", "AB-", "AB+"],
    "B+": ["B+", "AB+"],
    "AB-": ["AB-", "AB+"],
    "AB+": ["AB+"]
}

def get_compatible_blood_types(blood_type):
    """
    Returns a list of blood types that CAN receive the given blood type.
    Example: O- can donate to everyone. O+ can donate to O+, A+, B+, AB+.
    """
    return COMPATIBILITY.get(blood_type, [])

def who_can_donate_to(needed_blood_type):
    """
    Returns a list of blood types from which the needed blood type can receive.
    Example: If needed is A+, it can receive from A+, A-, O+, O-.
    """
    compatible_donors = []
    for donor_type, receivers in COMPATIBILITY.items():
        if needed_blood_type in receivers:
            compatible_donors.append(donor_type)
    return compatible_donors
