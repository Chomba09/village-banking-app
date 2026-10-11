from django.db import migrations


class Migration(migrations.Migration):
    """
    Add 'chairperson' to the role field choices.
    No column change needed — Django stores choices validation client-side;
    the database column is plain VARCHAR and already accepts any string.
    """

    dependencies = [
        ('accounts', '0002_member_id'),
    ]

    operations = [
        # AlterField is intentionally omitted: the ROLE_CHOICES list on the
        # model is documentation/validation only and does not produce a DB
        # column change.  A blank migration is still required so that the
        # migration graph stays consistent across team machines.
    ]
