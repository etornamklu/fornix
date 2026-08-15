import string
import random


def generate_uid() -> str:
    details = string.ascii_uppercase + string.ascii_lowercase + string.digits
    alpha_list = [letter for letter in details]
    # print(alpha_list)
    length = len(alpha_list)
    random_list = random.choices(
        alpha_list, weights=[random.randint(1, 3)] * length, k=8
    )
    randomUID = "".join(random_list)
    return randomUID
